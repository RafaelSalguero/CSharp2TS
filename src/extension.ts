'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as types from './types';

import { parseProperty, CSharpProperty } from "./properties";
import { parseMethod, CSharpMethod, CSharpParameter, parseConstructor, parseRecord } from "./methods";

import { generateProperty, trimMemberName, generateMethod, generateConstructor, generateClass, generateRecord } from "./generators";
import { ExtensionConfig } from "./config";
import { ParseResult } from "./parse";
import compose = require("./compose");
import regexs = require("./regexs");
import { parseXmlDocBlock, generateJsDoc } from "./commentDoc";
import { parseClass } from "./classes";

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
const csRecord = csFunction(parseRecord, generateRecord);
const csMethod = csFunction(parseMethod, generateMethod);
const csConstructor = csFunction(parseConstructor, generateConstructor);
const csCommentSummary = csFunction(parseXmlDocBlock, generateJsDoc);
const csClass = csFunction(parseClass, generateClass);

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
        csRecord,
        csClass,
        csAutoProperty,
        csConstructor,
        csMethod,
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

function removeSpecialKeywords(code: string): string {
    return code.replace(/\s+virtual\s+/g, ' ').replace(/#nullable\s*(disable|enable)\s*\n/g,'');
}

function removeUsings(code: string): string {
    return code.replace(/using\s+[^;]+;\s*\n/g, '');
}

/**Convert c# code to typescript code */
export function cs2ts(code: string, config: ExtensionConfig): string {
    var ret = "";

    if (config.removeSpecialKeywords) {
        code = removeSpecialKeywords(code);
    }

    if (config.removeUsings) {
        code = removeUsings(code);
    }

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

    const rawTrimPostfixes = vscode.workspace.getConfiguration('csharp2ts').get("trimPostfixes") as string | string[];
    const trimPostfixes: string[] = typeof rawTrimPostfixes == "string" ? [rawTrimPostfixes] : rawTrimPostfixes;

    const propertiesToCamelCase = vscode.workspace.getConfiguration('csharp2ts').get("propertiesToCamelCase") as boolean;
    const recursiveTrimPostfixes = vscode.workspace.getConfiguration('csharp2ts').get("recursiveTrimPostfixes") as boolean;
    const ignoreInitializer = vscode.workspace.getConfiguration('csharp2ts').get("ignoreInitializer") as boolean;
    const removeMethodBodies = vscode.workspace.getConfiguration('csharp2ts').get("removeMethodBodies") as boolean;
    const removeConstructors = vscode.workspace.getConfiguration('csharp2ts').get("removeConstructors") as boolean;
    const methodStyle = vscode.workspace.getConfiguration('csharp2ts').get("methodStyle") as ("signature" | "lambda");
    const byteArrayToString = vscode.workspace.getConfiguration('csharp2ts').get("byteArrayToString") as boolean;
    const dateToDateOrString = vscode.workspace.getConfiguration('csharp2ts').get("dateToDateOrString") as boolean;
    const removeWithModifier = vscode.workspace.getConfiguration('csharp2ts').get("removeWithModifier") as string[];
    const removeNameRegex = vscode.workspace.getConfiguration('csharp2ts').get("removeNameRegex") as string;
    const classToInterface = vscode.workspace.getConfiguration('csharp2ts').get("classToInterface") as boolean;
    const preserveModifiers = vscode.workspace.getConfiguration('csharp2ts').get("preserveModifiers") as boolean;
    const removeSpecialKeywords = vscode.workspace.getConfiguration('csharp2ts').get("removeSpecialKeywords") as boolean;
    const removeUsings = vscode.workspace.getConfiguration('csharp2ts').get("removeUsings") as boolean;

    return {
        propertiesToCamelCase,
        trimPostfixes,
        recursiveTrimPostfixes,
        ignoreInitializer,
        removeMethodBodies,
        removeConstructors,
        methodStyle,
        byteArrayToString,
        dateToDateOrString,
        removeWithModifier,
        removeNameRegex,
        classToInterface,
        preserveModifiers,
        removeSpecialKeywords,
        removeUsings
    };
}


// this method is called when your extension is deactivated
export function deactivate() {
}
