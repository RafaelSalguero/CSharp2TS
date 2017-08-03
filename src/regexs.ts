import {
    any, cap, nonCap, oneOrMore, optional, seq, zeroOrMore
} from "./compose";

export const identifier = /[a-zA-Z0-9_]+/;
export const space = /\s+/;
export const spaceOrLine = /(?:\s|\n)+/;
export const spaceOrLineOptional = /(?:\s|\n)*/;
export const spaceOptional = /\s*/;
export const anyChar = /(?:.|\n)/;


/**Regex que encaga con un tipo */
export const type = (() => {
    const arrayDimension = zeroOrMore(/\[,*\]/);
    const type = seq(
        nonCap(identifier),
        spaceOptional,
        optional(/<.*>/),
        spaceOptional,
        optional(/\?/),
        arrayDimension
    );
    return type;
})();

export function allMatches(text: string, pattern: RegExp) {
    const reg = new RegExp(pattern, "g");
    let match : RegExpExecArray | null;
    const ret: RegExpExecArray[] = [];
    while(match = reg.exec(text)) {
        ret.push(match);
    }
    return ret;
}
