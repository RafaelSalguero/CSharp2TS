import {
    any, cap, nonCap, oneOrMore, optional, seq, zeroOrMore
} from "./compose";

export interface CSharpProperty {
    name: string;
    type: string;
    initializer: string;
}

export interface ParseResult<T> {
    data: T;
    length: number;
    index: number;
}


export function parseProperty(code: string): ParseResult<CSharpProperty> | null {
    const propModifier = optional(seq(
        optional(/public/),
        optional(any(/\s+new/, /\s+override/)),
        /\s*/
    ));

    const identifier = /[a-zA-Z0-9_]+/;
    const space = /\s+/;
    const spaceOptional = /\s*/;
    const propName = seq(cap(identifier), space);

    //Regex que captura el tipo
    const type = (() => {
        const arrayDimension = zeroOrMore(/\[,*\]/);
        const type = seq(
            nonCap(identifier),
            spaceOptional,
            optional(/<.*>/),
            spaceOptional,
            optional(/\?/),
            arrayDimension,
            space
        );
        return cap(type);
    })();


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
        propModifier,
        type,
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