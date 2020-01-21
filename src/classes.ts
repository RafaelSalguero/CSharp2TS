export interface CSharpClass {
    name: string;
    type: "class" | "interface" | "struct";
    isPublic: boolean;
    inherits: string[];
}

import {
    any, cap, nonCap, oneOrMore, optional, seq, zeroOrMore, commas, neasted,
} from "./compose";
import regexs = require("./regexs");

import { ParseResult } from "./parse";
import { CsType, splitTopLevel, parseType } from "./types";
import { accessModifierRegex } from "./modifiers";

export function parseInherits(code: string): string[] {
    const types = splitTopLevel(code, [","]);
    return types;
}

export function parseClass(code: string): ParseResult<CSharpClass> | null {
    const modifier = optional(seq(
        cap(accessModifierRegex),
        optional(/partial\s+/),
        optional(/(?:sealed|abstract)\s+/),
    ));
    const { identifier, space, spaceOptional, type, spaceOrLine } = regexs;
    const classType = seq(cap(any(/class/, /interface/, /struct/)), space);
    const className = cap(identifier);
    const separator = /,\s*/;

    const inherits = optional(seq(
        /\s*:\s/,
        cap(commas(type, separator))
    ));

    const classRegex = seq(
        modifier,
        classType,
        className,
        inherits
    );

    const match = classRegex.exec(code);
    if (!match) {
        return null;
    } else {
        return {
            index: match.index,
            length: match[0].length,
            data: {
                isPublic: (match[1] || "").trim() == "public",
                type: match[2] as any,
                name: match[3],
                inherits: parseInherits(match[4] || "")
            }
        }
    }
}