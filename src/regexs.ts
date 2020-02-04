import {
    any, cap, nonCap, oneOrMore, optional, seq, zeroOrMore, neasted
} from "./compose";

export const identifier = /[a-zA-Z\u00C0-\u00FF_][a-zA-Z\u00C0-\u00FF_0-9]*/;
export const space = /\s+/;
export const spaceOrLine = /(?:\s|\n|\r)+/;
export const spaceOrLineOptional = /(?:\s|\n|\r)*/;
export const spaceOptional = /\s*/;
export const anyChar = /(?:.|\n|\r)/;
export const spaceNotLine = /[ \t]/;
export const lineJump =  /(?:\r|\n|(?:\r\n)|(?:\n\r))/;

/**Regex que encaga con un tipo */
export const type = (() => {
    const arrayDimension = oneOrMore(/\[,*\]/);
    const generic = neasted("<", ">", 6, false);
    const type = seq(
        nonCap(identifier),
        optional(seq(spaceOptional,generic)),
        optional(seq(spaceOptional, /\?/)),
        optional(seq(spaceOptional, arrayDimension)),
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
