import {
    any, cap, nonCap, oneOrMore, optional, seq, zeroOrMore, commas
} from "./compose";
import regexs = require("./regexs");

import { ParseResult } from "./parse";
import { ExtensionConfig } from "./config";
export interface CSharpProperty {
    name: string;
    type: string;
    initializer: string;
}

export function parseProperty(code: string): ParseResult<CSharpProperty> | null {
    const { identifier, space, spaceOptional, type, spaceOrLineOptional } = regexs;
    const propAttributes =  optional(seq(commas(
        seq(/\[/, identifier, /.*/, /\]/),
        spaceOrLineOptional
    ), spaceOrLineOptional  ));

    const propModifier = optional(seq(
        optional(/public/),
        optional(any(/\s+new/, /\s+override/)),
        /\s*/
    ));


    const propName = seq(cap(identifier), spaceOptional);

    //Regex que captura el get set con initializador o el fat arrow
    const getSetOrFatArrow = (() => {
        const getSetModifier = optional(any(/internal/, /public/, /private/, /protected/));
        const get = seq(getSetModifier, spaceOptional, /get\s*;/);
        const set = seq(getSetModifier, spaceOptional, /set\s*;/);
        const initializer = optional(seq(spaceOptional, /=/, spaceOptional, cap(/.*/), /;/));
        const getSet = seq(/{/, spaceOptional, get, spaceOptional, optional(set), spaceOptional, /}/, initializer);
        const fatArrow = /=>.*;/;
        const getSetOrFatArrow = any(getSet, fatArrow);
        return getSetOrFatArrow;
    })();

    //Regex que captura a toda la propiedad:
    const prop = seq(
        propAttributes,
        propModifier,
        seq(cap(type), space),
        propName,
        getSetOrFatArrow
    );

    const match = prop.exec(code);
    if (!match) {
        return null;
    } else {
        return {
            index: match.index,
            length: match[0].length,
            data: {
                type: match[1],
                name: match[2],
                initializer: match[3]
            }
        }
    }
}