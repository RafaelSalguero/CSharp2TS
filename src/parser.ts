import { ParseResult } from "./parse";

export function ParseRegex<T>(text: string, regex: RegExp, parse: (data: string[]) => T): ParseResult<T> | null {
    const result = new RegExp(regex, "g").exec(text);
    if (result == null) {
        return null;
    } else {
        return {
            index: result.index,
            length: result[0].length,
            data: parse(result.map(x => x))
        }
    }
}

export interface TypedParserFunction<TName extends string, TData> {
    type: TName;
    func: (code: string) => ParseResult<TData> | null;
}

export type ParserFunction<TData> = (code: string) => ParseResult<TData> | null;

export interface MultiMatchResult<TName, TData> {
    type: TName;
    result: TData;
}
/**Find the next match of a given list of named parser functions */
export function firstMatch<TData>(code: string, functions: ParserFunction<TData>[]): ParseResult<TData> | null {
    let firstMatch: ParseResult<TData> | null = null;
    for (const func of functions) {
        const match = func(code);
        if (match && (firstMatch == null || match.index < firstMatch.index)) {
            firstMatch = match;
        }
    }

    return firstMatch;
}

function subStrMatch<T>(match: ParseResult<T>, index: number): ParseResult<T> {
    return {
        data: match.data,
        index: match.index + index,
        length: match.length
    };
}

/**Find all matches in a text block. Unmatched text is returned as a ParseResult with an undefined data */
export function allMatches<TData>(code: string, func: (code: string) => ParseResult<TData> | null): ParseResult<TData | undefined>[] {
    let index = 0;
    const ret: ParseResult<TData | undefined>[] = [];
    while (true) {
        const substr = code.substr(index);
        const matchOrNull = func(substr);
        if (matchOrNull == null) break;
        const nextMatch = subStrMatch(matchOrNull, index);

        //add the last unmatched code:
        ret.push({
            data: undefined,
            index: index,
            length: nextMatch.index - index
        });

        //add the matched code:
        ret.push(nextMatch);

        //increment the search index:
        index = nextMatch.index + nextMatch.length;
    }

    //add the last unmatched code:
    ret.push({
        data: undefined,
        index: index,
        length: code.length - index
    });

    //Filter empty unmatched code:
    const filtered = ret.filter(x => !(x.data == undefined && x.length == 0));
    return filtered;
}