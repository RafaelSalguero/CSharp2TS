import * as vscode from 'vscode';
import * as types from './types';
import { ExtensionConfig } from "./config";

import { parseProperty, CSharpProperty } from "./properties";
import { parseMethod, CSharpMethod, CSharpParameter, CSharpConstructor, parseConstructor } from "./methods";
import { CSharpClass } from "./classes";

function generateType(type: string, config: ExtensionConfig): string {
    const parseType = types.parseType(type);
    return trimMemberName(parseType ? types.convertToTypescript(parseType, config) : type, config);
}

function generateParam(value: CSharpParameter, config: ExtensionConfig): string {
    const tsType = generateType(value.type, config);
    return value.name + ": " + tsType;
}

function generateControllerBody(name: string, params: CSharpParameter[]): string {
    const isUriSimpleType = (x: CSharpParameter) => {
        const parseType = types.parseType(x.type);
        return parseType && types.isUriSimpleType(parseType);
    }

    const simpleParams = params.filter(isUriSimpleType).map(x => x.name).join(", ");
    const bodyParams = params.filter(x => !isUriSimpleType(x)).map(x => x.name).join(", ");

    if (bodyParams.length == 0) {
        return ` => await controller('${name}', {${simpleParams}}), `;
    } else {
        return ` => await controller('${name}', {${simpleParams}}, ${bodyParams}), `;
    }
}

export function generateMethod(value: CSharpMethod, config: ExtensionConfig): string {
    const paramList = value.parameters.map(x => generateParam(x, config)).join(", ");
    const returnType = generateType(value.returnType, config);

    const fullType = "(" + paramList + "): " + returnType;
    const lambdaBody = (value.name + ": " + (value.async ? "async " : "")) + fullType;

    return (
        config.methodStyle == "signature" ? (value.name + fullType + ";") :
            config.methodStyle == "lambda" ? lambdaBody + " => { throw new Error('TODO'); }, " :
                config.methodStyle == "controller" ? lambdaBody + generateControllerBody(value.name, value.parameters)
                    : config.methodStyle
    );
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

    const removeNameRegex = config.removeNameRegex != "" && (new RegExp(config.removeNameRegex)).test(name);
    const removeModifier = config.removeWithModifier.indexOf(prop.modifier) != -1;
    const removeProp = removeNameRegex || removeModifier;
    const modifier = prop.modifier; //TODO: Convert C# modifiers to TS modifiers
    if (removeProp) {
        return "";
    }

    return (
        (
            config.preserveModifiers ? (modifier + " ") : ""
        ) +
        (printInitializer ?
            (name + ": " + tsType + " = " + prop.initializer + ";") :
            (name + ": " + tsType + ";"))
    );
}

export function generateClass(x: CSharpClass, config: ExtensionConfig): string {
    const inheritsTypes = x.inherits.map(x => generateType(x, config));
    const name = x.name;
    const modifier = (x.isPublic ? "export " : "");
    const keyword = config.classToInterface ? "interface" : "class";
    const prefix = `${modifier}${keyword} ${name}`;
    if (inheritsTypes.length > 0) {
        return `${prefix} extends ${inheritsTypes.join(", ")}`;
    } else {
        return prefix;
    }
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