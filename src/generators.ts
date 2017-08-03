import * as vscode from 'vscode';
import * as types from './types';
import { ExtensionConfig } from "./config";

import { parseProperty, CSharpProperty } from "./properties";
import { parseMethod, CSharpMethod, CSharpParameter, CSharpConstructor, parseConstructor } from "./methods";


function generateType(type: string, config: ExtensionConfig): string {
    const parseType = types.parseType(type);
    return trimMemberName(parseType ? parseType.convertToTypescript() : type, config);
}

function generateParam(value: CSharpParameter, config: ExtensionConfig): string {
    const tsType = generateType(value.type, config);
    return value.name + ": " + tsType;
}

export function generateMethod(value: CSharpMethod, config: ExtensionConfig): string {
    const paramList = value.parameters.map(x => generateParam(x, config)).join(", ");
    const returnType = generateType(value.returnType, config);

    const fullType = "(" + paramList + "): " + returnType;
    return config.methodStyle == "signature" ? (value.name + fullType + ";") :
        config.methodStyle == "lambda" ? (value.name + ": " + (value.async ? "async " : "") + fullType + " => { throw new Error('TODO'); }, ") : null as never;
}

export function generateConstructor(value: CSharpConstructor, config: ExtensionConfig): string {
    const paramList = value.parameters.map(x => generateParam(x, config)).join(", ");
    return config.removeConstructors ? "" : ("new(" + paramList + "): " + value.name + ";");
}

const myClass = {
    myMethod: (hola: boolean): string => {
        throw new Error("TODO: Implement me");
    }
}


/**Generate a typescript property */
export function generateProperty(prop: CSharpProperty, config: ExtensionConfig): string {
    //trim spaces:
    const tsType = generateType(prop.type, config);
    const name = getTypescriptPropertyName(prop.name, config);
    const printInitializer = !config.ignoreInitializer && (!!prop.initializer);

    return printInitializer ?
        (name + ": " + tsType + " = " + prop.initializer + ";") :
        (name + ": " + tsType + ";");
}

function getTypescriptPropertyName(name: string, config: ExtensionConfig) {
    var isAbbreviation = name.toUpperCase() == name;
    name = trimMemberName(name, config);
    if (config.propertiesToCamelCase && !isAbbreviation) {
        return name[0].toLowerCase() + name.substr(1);
    }

    return name;
}

export function trimMemberName(name: string, config: ExtensionConfig): string {
    name = name.trim();

    var postfixes = config.trimPostfixes;
    if (!postfixes)
        return name;
    var trimRecursive = config.recursiveTrimPostfixes;

    var trimmed = true;
    do {
        trimmed = false;

        for (let postfix of postfixes) {
            if (!name.endsWith(postfix))
                continue;

            name = trimEnd(name, postfix);
            if (!trimRecursive)
                return name;

            trimmed = true;
        }
    } while (trimmed); // trim recursive until no more occurrences will be found

    return name;
}

function trimEnd(text: string, postfix: string) {
    if (text.endsWith(postfix)) {
        return text.substr(0, text.length - postfix.length);
    }
    return text;
}