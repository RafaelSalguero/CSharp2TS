'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as types from './types';

import { parseProperty, CSharpProperty } from "./properties";
import { parseMethod, CSharpMethod, CSharpParameter, parseConstructor } from "./methods";

import { generateProperty, trimMemberName, generateMethod, generateConstructor } from "./generators";
import { ExtensionConfig } from "./config";
import { ParseResult } from "./parse";
import compose = require("./compose");
import regexs = require("./regexs");

function csFunction<T>(parse: (code: string) => ParseResult<T> | null, generate: (value: T, config: ExtensionConfig) => string) {
    return function (code: string, config: ExtensionConfig) {
        const parseResult = parse(code);
        if (!parseResult) {
            return null;
        } else {
            return {
                result: generate(parseResult.data, config),
                index: parseResult.index,
                length: parseResult.length
            } as MatchResult;
        }
    }
}

/**Convert a c# automatic or fat arrow property to a typescript property. Returns null if the string didn't match */
const csAutoProperty = csFunction(parseProperty, generateProperty);
/**Convert a C# method to a typescript method signature */
const csMethod = csFunction(parseMethod, generateMethod);
const csConstructor = csFunction(parseConstructor, generateConstructor);

function csAttribute(code: string, config: ExtensionConfig): MatchResult {
    var patt = /[ \t]*\[\S*\][ \t]*\r?\n/;
    var arr = patt.exec(code);
    if (arr == null) return null;

    return {
        result: "",
        index: arr.index,
        length: arr[0].length
    };
}

interface Match {
    /**Replacement string */
    result: string;
    /**Original index */
    index: number;
    /**Original lenght */
    length: number;
}

type MatchResult = Match | null;

/**
 * 
 * @param code 
 * @param config 
 */
function csCommentSummary(code: string, config: ExtensionConfig): MatchResult {
    var patt = /\/\/\/ <summary>\r?\n((?:\s*\/\/\/.*\r?\n?)*) <\/summary>/;
    var arr = patt.exec(code);
    if (arr == null) return null;

    //Split summary lines:
    var lines = arr[1];
    var separatorPattern = /([ \t]*)\/\/\/\s?(.+)/g;
    var lineArr: RegExpExecArray | null;
    var ret = "/*";
    var first = true;
    while ((lineArr = separatorPattern.exec(arr[1])) != null) {
        if (!first) {
            ret += "\r\n" + lineArr[1];
        }

        ret += "*" + lineArr[2];

        first = false;
    }
    ret += " */";
    return {
        result: ret,
        index: arr.index,
        length: arr[0].length
    };
}


function csPublicMember(code: string, config: ExtensionConfig): MatchResult {
    var patt = /public\s*(?:(?:abstract)|(?:sealed))?(\S*)\s+(.*)\s*{/;
    var arr = patt.exec(code);

    var tsMembers: { [index: string]: string } = {
        'class': 'interface',
        'struct': 'interface'
    };

    if (arr == null) return null;
    var tsMember = tsMembers[arr[1]];
    var name = trimMemberName(arr[2], config);
    return {
        result: `export ${tsMember || arr[1]} ${name} {`,
        index: arr.index,
        length: arr[0].length
    };
}



/**Find the next match */
function findMatch(code: string, startIndex: number, config: ExtensionConfig): MatchResult {
    code = code.substr(startIndex);

    var functions: ((code: string, config: ExtensionConfig) => MatchResult)[] = [
        csAutoProperty,
        csMethod,
        csConstructor,
        csCommentSummary,
        csAttribute,
        csPublicMember
    ];

    var firstMatch: MatchResult = null;
    for (let i = 0; i < functions.length; i++) {
        var match = functions[i](code, config);
        if (match != null && (firstMatch == null || match.index < firstMatch.index)) {
            firstMatch = match;
        }
    }

    return firstMatch ? {
        result: firstMatch.result,
        index: firstMatch.index + startIndex,
        length: firstMatch.length
    } : null;
}

/**Convert c# code to typescript code */
export function cs2ts(code: string, config: ExtensionConfig): string {
    var ret = "";

    var index = 0;
    while (true) {
        var nextMatch = findMatch(code, index, config);
        if (nextMatch == null)
            break;
        //add the last unmatched code:
        ret += code.substr(index, nextMatch.index - index);

        //add the matched code:
        ret += nextMatch.result;

        //increment the search index:
        index = nextMatch.index + nextMatch.length;
    }
    //add the last unmatched code:
    ret += code.substr(index);

    return ret;
}



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "csharp2ts" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.cs2ts', () => {
        // The code you place here will be executed every time your command is executed

        var editor = vscode.window.activeTextEditor;
        if (!editor)
            return;

        var selection = editor.selection;
        var text = editor.document.getText(selection);

        editor.edit(e => {
            var config = getConfiguration();
            e.replace(selection, cs2ts(text, config));
        });
    });

    context.subscriptions.push(disposable);
}

function getConfiguration(): ExtensionConfig {

    var rawTrimPostfixes = vscode.workspace.getConfiguration('csharp2ts').get("trimPostfixes") as string | string[];
    var trimPostfixes: string[] = [];
    if (typeof rawTrimPostfixes == "string") {
        trimPostfixes = [rawTrimPostfixes];
    } else {
        trimPostfixes = rawTrimPostfixes;
    }

    var propertiesToCamelCase = vscode.workspace.getConfiguration('csharp2ts').get("propertiesToCamelCase") as boolean;
    var recursiveTrimPostfixes = vscode.workspace.getConfiguration('csharp2ts').get("recursiveTrimPostfixes") as boolean
    var ignoreInitializer = vscode.workspace.getConfiguration('csharp2ts').get("ignoreInitializer") as boolean
    var removeMethodBodies = vscode.workspace.getConfiguration('csharp2ts').get("removeMethodBodies") as boolean
    var removeConstructors = vscode.workspace.getConfiguration('csharp2ts').get("removeConstructors") as boolean
    var methodStyle = vscode.workspace.getConfiguration('csharp2ts').get("methodStyle") as ("signature" | "lambda")

    return {
        propertiesToCamelCase,
        trimPostfixes,
        recursiveTrimPostfixes,
        ignoreInitializer,
        removeMethodBodies,
        removeConstructors,
        methodStyle
    };
}


// this method is called when your extension is deactivated
export function deactivate() {
}
