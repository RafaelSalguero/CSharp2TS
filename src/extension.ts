'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


/**Convert a c# automatic property to a typescript property. Returns null if the string didn't match */
function csAutoProperty(code: string): Match {
    var patt = /(?:public)? *(\S*) {1,}(\S*) {1,}{ *get; *set; *} *(\r\n)?/;
    var arr = patt.exec(code);
    if (!arr) {
        return null;
    }
    var type = arr[1].replace("?", "");
    var name = arr[2];

    var tsTypes: { [index: string]: string } = {
        'int': 'number',
        'float': 'number',
        'decimal': 'number',
        'long': 'number',
        'byte': 'number',
        'short': 'number',
        'DateTime': 'date',
    };

    var tsType = tsTypes[type] ? tsTypes[type] : type;
    return {
        result: name + " : " + type + ";\r\n",
        index: arr.index,
        length: arr[0].length
    };

}

function csAttribute(code: string): Match {
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

function csCommentSummary(code: string): Match {
    var patt = /\/\/\/ <summary>\r?\n((?:\s*\/\/\/.*\r?\n?)*) <\/summary>/;
    var arr = patt.exec(code);
    if (arr == null) return null;

    //Split summary lines:
    var lines = arr[1];
    var separatorPattern = /([ \t]*)\/\/\/\s?(.+)/g;
    var lineArr: RegExpExecArray;
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

function csPublicMember(code: string): Match {
    var patt = /public\s+(\S*)\s+(.*)/;
    var arr = patt.exec(code);

    var tsMembers: { [index: string]: string } = {
        'class': 'interface'
    };

    if (arr == null) return null;
    var tsMember = tsMembers[arr[1]]
    return {
        result: `export ${tsMember || arr[1]} ${arr[2]}`,
        index: arr.index,
        length: arr[0].length
    };
}

/**Find the next match */
function findMatch(code: string, startIndex: number): Match {
    code = code.substr(startIndex);

    var functions: ((code: string) => Match)[] = [
        csAutoProperty,
        csCommentSummary,
        csAttribute,
        csPublicMember
    ];

    var firstMatch: Match = null;
    for (let i = 0; i < functions.length; i++) {
        var match = functions[i](code);
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
function cs2ts(code: string): string {
    var ret = "";
    var lineArr: RegExpExecArray;
    var lastAddedLineJump = true;

    var index = 0;
    while (true) {
        var nextMatch = findMatch(code, index);
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
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');

        var editor = vscode.window.activeTextEditor;
        if (!editor)
            return;

        var selection = editor.selection;
        var text = editor.document.getText(selection);

        editor.edit(e => {
            e.replace(selection, cs2ts(text));
        });
    });

    context.subscriptions.push(disposable);
}


// this method is called when your extension is deactivated
export function deactivate() {
}