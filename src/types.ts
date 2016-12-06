/**A c# type */
class CsType {
    constructor(name: string, generics: CsType[], array: CsArray[]) {
        this.name = name;
        this.generics = generics;
        this.array = array;
    }

    /**Type name */
    name: string;
    /**Generic arguments */
    generics: CsType[];

    /**Neasted arrays */
    array: CsArray[];
}

/**A c# array */
interface CsArray {
    /**Array dimensions */
    dimensions: number;
}

/**Split on top level by a given separator, separators inside < >, [ ], { } or ( ) groups are not considered
 * 
 * @param separator One char separators
 */
function splitTopLevel(text: string, separators: string[], openGroup: string[], closeGroup: string[]): string[] {
    var ret: string[] = [];
    var level = 0;
    var current = "";
    var openGroup = ["[", "(", "<", "{"];
    var closeGroup = ["]", ")", ">", "}"];
    for (let i = 0; i < text.length; i++) {
        let char = text.charAt(i);
        if (openGroup.indexOf(char) != -1) {
            level++;
        }
        if (closeGroup.indexOf(char) != -1) {
            level--;
        }

        if (level == 0 && separators.indexOf(char) != -1) {
            ret.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    if (current != "")
        ret.push(current);
    return ret;
}

/**Split on top level commas */
function splitCommas(text: string): string[] {
    return splitTopLevel(text, [","], ["[", "(", "<", "{"], ["]", ")", ">", "}"]);
}

/**Parse an array definition */
function parseArray(code: string): CsArray[] {
    let ret: CsArray[] = [];
    for (let i = 0; i < code.length; i++) {
        let char = code.charAt(i);
        if (char == "[") {
            ret.push({ dimensions: 1 });
        }
        if (char == "," && ret.length) {
            ret[ret.length - 1].dimensions++;
        }
    }
    return ret;
}

/**Parse a C# type, returns null if the given type could not be parsed */
function parseType(code: string): CsType | null {
    //Remove all spaces:
    code = code.replace(" ", "");

    //group 1: Type name
    //group 2: Generic arguments
    //group 3: Arrays
    var patt = /([a-zA-Z0-9_]+)\s*(?:<(.*)>)?\s*(\[[,\[\]]*\])*/;

    var arr = patt.exec(code);
    if (!arr) {
        return null;
    }
    var name = arr[1];
    var generics = splitCommas(arr[2] || "");
    var arrays = arr[3] || "";

    return new CsType(name, generics.map(x => parseType(x)), parseArray(arrays));
}

