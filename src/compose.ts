/**Return a regex that matches any of the given components */
export function any(...components: RegExp[]) {
    const sources = components.map(x => nonCap(x).source);
    const sourceComb = sources.join("|");
    const combined = "(?:" + sourceComb + ")";
    return new RegExp(combined);
}

/**Concat regexes */
export function seq(...components: RegExp[]) {
    return nonCap(new RegExp(components.map(x => x.source).join("")));
}


/**Enclose a regex on a non capturing group */
export function nonCap(component: RegExp) {
    return new RegExp("(?:" + component.source + ")");
}

/**Enclose a regex on a capturing group */
export function cap(component: RegExp) {
    return new RegExp("(" + component.source + ")");
}

/**Enclose a regex on an optional non capturing group */
export function optional(component: RegExp) {
    return new RegExp(nonCap(component).source + "?");
}

/**Enclose a regex on a zero or more repetition non capturing group */
export function zeroOrMore(component: RegExp) {
    return new RegExp(nonCap(component).source + "*");
}

/**Enclose a regex on a one or more repetition non capturing group */
export function oneOrMore(component: RegExp) {
    return new RegExp(nonCap(component).source + "+");
}

/**Return a regex that parses a list of items separated with the given separator.
 * For capturing also an empty list enclose the commas regex on an optional regex
 */
export function commas(item: RegExp, separator: RegExp) {
    return seq(nonCap(item), zeroOrMore(seq(separator, item)));
}

/**Create a regex that matches the given string  */
export function str(str: string) {
    return new RegExp(escapeRegExp(str));
}

function escapeRegExp(str: string) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

/**Create an array with a range of numbers */
function range(start: number, count: number, step = 1) {
    const ret: number[] = [];
    for (let i = start; i < start + (count * step); i += step) {
        ret.push(i);
    }
    return ret;
}

/**Return a regex that parses a neasted expression
 * @param allowZeroDepth True to generate a regex that matches any text without the enclosing characters, false to make required at least one pair of enclosing characters
*/
export function neasted(start: string, end: string, maxDepth: number, allowZeroDepth: boolean) {
    if (start.length != 1) throw new Error("start should be a single character");
    if (end.length != 1) throw new Error("end should be a single character");

    start = escapeRegExp(start);
    end = escapeRegExp(end);

    const bodyCharSource = `[^${start}${end}]`;
    const bodyChar = new RegExp(bodyCharSource);
    const zeroDepth = nonCap(oneOrMore(bodyChar));
    const repeat = (s: string, n: number) => range(0, n).map(x => s).join("");
    const nDepth = (n: number) =>
        n == 0 ? zeroDepth :
            nonCap(new RegExp(repeat(start + bodyCharSource + "*", n - 1) + start +  bodyCharSource + "*" + end + repeat(bodyCharSource + "*" + end, n - 1)));


    const minDepth = allowZeroDepth ? 0 : 1;
    const allDepths = range(minDepth, maxDepth + 1 - minDepth).map(i => nDepth(i));
    const ret = any(...allDepths);

    return ret;
}
