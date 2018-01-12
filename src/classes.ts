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

export function parseInherits(code: string): string[] {
    const types = splitTopLevel(code, [","]);
    return types;
}

export function parseClass(code: string): ParseResult<CSharpClass> | null {
    const modifier = optional(seq(
        optional(any(seq(cap(/public/), /\s+/), /private\s+/, /protected\s+/, /internal\s+/)),
        optional(/\s+sealed\s+/),
        optional(/\s+abstract\s+/),
    ));
    const { identifier, space, spaceOptional, type, spaceOrLine } = regexs;
    const classType = cap(any(/class\s+/, /interface\s+/, /struct\s+/));
    const className = cap(identifier);
    const separator = seq(/,/, optional(spaceOrLine));

    const inherits = optional(seq(
        /\s+:\s/,
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
                isPublic: match[1] == "public",
                type: match[2] as any,
                name: match[3],
                inherits: parseInherits(match[4] || "")
            }
        }
    }
}