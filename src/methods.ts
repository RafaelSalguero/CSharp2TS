import {
    any, cap, nonCap, oneOrMore, optional, seq, zeroOrMore, commas, neasted,
} from "./compose";
import regexs = require("./regexs");
import { ParseResult } from "./parse";
import { maxBodyDepth, maxExpressionDepth } from "./config";
import { accessModifierRegex } from "./modifiers";
export interface CSharpParameter {
    modifier: string;
    name: string;
    type: string;
    spaceBeforeComma: string;
    spaceAfterComma: string;
}
export interface CSharpMethod {
    name: string;
    modifier: string;
    returnType: string;
    async: boolean;
    parameters: CSharpParameter[];
    body: string;
}

export interface CSharpRecord {
    name: string;
    isPublic: boolean;
    /**space after the first parenthesis */
    spaceAfterOpenPar: string;
    parameters: CSharpParameter[];
}

export interface CSharpConstructor {
    name: string;
    modifier: string;
    parameters: CSharpParameter[];
    body: string;
}

const { type, identifier, space, spaceOrLineOptional, spaceOrLine } = regexs;

export function parseParameters(code: string): CSharpParameter[] {
    const paramSeparator = seq(cap(/,/), cap(optional(spaceOrLine)));
    const modifier = cap(accessModifierRegex);
    const parameter = seq(modifier, cap(type), spaceOrLine, cap(identifier), cap(optional(spaceOrLine)), optional(paramSeparator));
    const all = regexs.allMatches(code, parameter);
    
    return all.map(x => ({
        modifier: x[1] ?? "",
        type: x[2],
        name: x[3],

        //If param doesn't have comma (x[5]), remaining space is considered to be after the separator
        spaceBeforeComma: x[5] ? x[4] : "",
        spaceAfterComma: (x[5] ? x[6] : x[4])
    } as CSharpParameter));
}


const { parseMethodRegex, parseConstructorRegex, parseRecordRegex } = (() => {
    const modifier = cap(accessModifierRegex);
    const async = cap(optional(seq(/async/, spaceOrLine)));
    const parameter = seq(type, spaceOrLine, identifier, optional(spaceOrLine));
    const paramSeparator = seq(/,/, optional(spaceOrLine));
    const paramList = seq(/\(/, spaceOrLineOptional, cap(optional(commas(parameter, paramSeparator))), /\)/);
    const methodType = seq(cap(type), spaceOrLine);
    const methodName = seq(cap(identifier), optional(spaceOrLine));

    const body = seq(spaceOrLineOptional, cap(neasted("{", "}", maxBodyDepth, false)));

    const method = seq(modifier, async, methodType, methodName, paramList, body);

    const constructorCall = optional(seq(spaceOrLineOptional, /:/, spaceOrLineOptional, any(/base/, /this/), spaceOrLineOptional, neasted("(", ")", maxExpressionDepth, false)));
    const constructor = seq(modifier, methodName, paramList, constructorCall, body);

    const recordParam = seq(modifier, parameter);
    const recordParamList = seq(/\(/, cap(spaceOrLineOptional), cap(optional(commas(recordParam, paramSeparator))), /\)/);

    const record = seq(modifier, /record/, spaceOrLine, methodName, recordParamList, spaceOrLineOptional, /;/)
    return { parseMethodRegex: method, parseConstructorRegex: constructor, parseRecordRegex: record };
})();

export function parseRecord(code: string): ParseResult<CSharpRecord> | null {
    const method = parseRecordRegex;
    const match = method.exec(code);
    if (!match) return null;

    return {
        index: match.index,
        length: match[0].length,
        data: {
            isPublic: (match[1] || "").trim() == "public",
            name: match[2],
            spaceAfterOpenPar: match[3],
            parameters: parseParameters(match[4]),
        }
    }
}

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