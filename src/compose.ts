/**Return a regex that matches any of the given components */
export function any(...components: RegExp[]) {
    const sources = components.map(x => nonCap(x).source);
    const sourceComb = sources.join("|");
    const combined = "(?:" + sourceComb + ")";
    return new RegExp(combined);
}

/**Concat regexes */
export function seq(...components: RegExp[]) {
    return new RegExp(components.map(x => x.source).join(""));
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
