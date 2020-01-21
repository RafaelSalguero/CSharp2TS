import {
    any, cap, nonCap, oneOrMore, optional, seq, zeroOrMore, commas, neasted,
} from "./compose";
import regexs = require("./regexs");
import { ParseResult } from "./parse";
import { maxBodyDepth, maxExpressionDepth } from "./config";
import { accessModifierRegex } from "./modifiers";
export interface CSharpParameter {
    name: string;
    type: string;
}
export interface CSharpMethod {
    name: string;
    modifier: string;
    returnType: string;
    async: boolean;
    parameters: CSharpParameter[];
    body: string;
}
export interface CSharpConstructor {
    name: string;
    modifier: string;
    parameters: CSharpParameter[];
    body: string;
}

const { type, identifier, space, spaceOrLineOptional, spaceOrLine } = regexs;

export function parseParameters(code: string): CSharpParameter[] {
    const parameter = seq(cap(type), spaceOrLine, cap(identifier), optional(spaceOrLine));
    const all = regexs.allMatches(code, parameter);
    return all.map(x => ({
        type: x[1],
        name: x[2]
    } as CSharpParameter));
}



const { parseMethodRegex, parseConstructorRegex } = (() => {
    const modifier = cap(accessModifierRegex);
    const async = cap(optional(seq(/async/, spaceOrLine)));
    const parameter = seq(type, spaceOrLine, identifier, optional(spaceOrLine));
    const paramSeparator = seq(/,/, optional(spaceOrLine));
    const paramList = seq(/\(/, cap(optional(commas(parameter, paramSeparator))), /\)/);
    const methodType = seq(cap(type), spaceOrLine);
    const methodName = seq(cap(identifier), optional(spaceOrLine));

    const body = seq(spaceOrLineOptional, cap(neasted("{", "}", maxBodyDepth, false)));

    const method = seq(modifier, async, methodType, methodName, paramList, body);

    const constructorCall = optional(seq(spaceOrLineOptional, /:/, spaceOrLineOptional, any(/base/, /this/), spaceOrLineOptional, neasted("(", ")", maxExpressionDepth, false)));
    const constructor = seq(modifier, methodName, paramList, constructorCall, body);
    return { parseMethodRegex: method, parseConstructorRegex: constructor };
})();

export function parseConstructor(code: string): ParseResult<CSharpConstructor> | null {
    const method = parseConstructorRegex;
    const match = method.exec(code);
    if (!match) {
        return null;
    } else {
        return {
            index: match.index,
            length: match[0].length,
            data: {
                modifier: match[1],
                name: match[2],
                parameters: parseParameters(match[3]),
                body: match[4]
            }
        }
    }
}

export function parseMethod(code: string): ParseResult<CSharpMethod> | null {
    //Regex captures:
    //modifier
    //async
    //type
    //name
    //paramList
    //body
    const method = parseMethodRegex;

    const match = method.exec(code);
    if (!match) {
        return null;
    } else {
        return {
            index: match.index,
            length: match[0].length,
            data: {
                modifier: match[1],
                async: !!match[2],
                returnType: match[3],
                name: match[4],
                parameters: parseParameters(match[5]),
                body: match[6]
            }
        }
    }
}