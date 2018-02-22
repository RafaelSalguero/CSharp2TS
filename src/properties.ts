import {
    any, cap, nonCap, oneOrMore, optional, seq, zeroOrMore, commas
} from "./compose";
import regexs = require("./regexs");

import { ParseResult } from "./parse";
import { ExtensionConfig } from "./config";
export interface CSharpProperty {
    name: string;
    type: string;
    modifier: string;
    initializer: string;
    /**True if this is a field, false if this is a property */
    isField: boolean;
}

export function parseProperty(code: string): ParseResult<CSharpProperty> | null {
    const { identifier, space, spaceOptional, type, spaceOrLineOptional } = regexs;
    const propAttributes = optional(seq(commas(
        seq(/\[/, identifier, /.*/, /\]/),
        spaceOrLineOptional
    ), spaceOrLineOptional));

    const propModifier = optional(seq(
        cap(
            seq(
            optional(any(/public/, /private/, /protected/, /internal/)),
            optional(any(/\s+new/, /\s+override/))
            ))
        ,
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

    const member = (() => {
        const initializer = optional(seq(spaceOptional, /=/, spaceOptional, cap(/.*/)));
        const ending = /;/;
        const member = seq(initializer, ending);
        return member;
    })();

    //Regex que captura a toda la propiedad:
    const prop = seq(
        propAttributes,
        propModifier,
        seq(cap(type), space),
        propName,
        cap(any(getSetOrFatArrow, member)),
    );


    const match = prop.exec(code);


    if (!match) {
        return null;
    } else {
        const isProperty = getSetOrFatArrow.test(match[4]);
        const isMember = !isProperty;

        return {
            index: match.index,
            length: match[0].length,
            data: {
                modifier: match[1],
                type: match[2],
                name: match[3],
                initializer: isMember ? match[6] : match[5],
                isField: isMember
            }
        }
    }
}