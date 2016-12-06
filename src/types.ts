enum CsTypeCategory {
    /**A type that can be represented as a collection of items */
    Enumerable,
    /**A dictionary is equivalent to a typescript object */
    Dictionary,
    /**A c$# nullable type where the value type is the first generic type */
    Nullable,
    /**A c# tuple */
    Tuple,
    /**A boolean type */
    Boolean,
    /**A numeric type */
    Number,
    /**A date type */
    Date,
    /**Any type */
    Any,
    /**Unidentified type */
    Other
}

/**A c# type */
export class CsType {
    constructor(name: string, generics: CsType[], array: CsArray[]) {
        this.name = name;
        this.generics = generics;
        this.array = array;
    }

    /**Nullable type name */
    static nullable = "Nullable";

    /**Type name */
    name: string;
    /**Generic arguments */
    generics: CsType[];

    /**Neasted arrays */
    array: CsArray[];

    /**Gets the type category */
    get category(): CsTypeCategory {
        var enumerables = ["List", "ObservableCollection", "Array", "IEnumerable", "IList", "IReadOnlyList", "Collection", "ICollection"];
        var dictionaries = ["Dictionary", "IDictionary"];

        var bools = ["bool", "Boolean", "System.Boolean"];
        var numbers = [
            'int', "Int32", "System.Int32",
            'float', "Single", "System.Single",
            'decimal', "Decimal", "System.Decimal",
            'long', "Int64", "System.Int64",
            'byte', "Byte", "System.Byte",
            'sbyte', "SByte", "System.SByte",
            'short', "Int16", "System.Int16",
            'ushort', "UInt16", "System.UInt16",
            'ulong', "UInt64", "System.UInt64"
        ];
        var dates = ["DateTime", "System.DateTime", "DateTimeOffset", "System.DateTimeOffset"];
        var anys = ["object", "System.Object", "dynamic"];
        if (enumerables.indexOf(this.name) != -1 && this.generics.length <= 1) {
            return CsTypeCategory.Enumerable;
        } else if (dictionaries.indexOf(this.name) != -1 && this.generics.length == 2) {
            return CsTypeCategory.Dictionary;
        } else if (this.name == CsType.nullable && this.generics.length == 1) {
            return CsTypeCategory.Nullable;
        } else if (this.name == "Tuple" && this.generics.length > 0) {
            return CsTypeCategory.Tuple;
        } else if (bools.indexOf(this.name) != -1 && this.generics.length == 0) {
            return CsTypeCategory.Boolean;
        } else if (numbers.indexOf(this.name) != -1 && this.generics.length == 0) {
            return CsTypeCategory.Number;
        } else if (dates.indexOf(this.name) != -1 && this.generics.length == 0) {
            return CsTypeCategory.Date;
        } else if (anys.indexOf(this.name) != -1 && this.generics.length == 0) {
            return CsTypeCategory.Any;
        } else {
            return CsTypeCategory.Other;
        }
    }

    /**Convert this type to a typescript type */
    private convertToTypescriptNoArray(): string {
        switch (this.category) {
            case CsTypeCategory.Enumerable: {
                if (this.generics.length == 0) {
                    return "any[]";
                } else if (this.generics.length == 1) {
                    return this.generics[0].convertToTypescript() + "[]";
                } else {
                    throw "";
                }
            }

            case CsTypeCategory.Dictionary: {
                if (this.generics.length == 2) {
                    return `{ [key: ${this.generics[0].convertToTypescript()}]: ${this.generics[1].convertToTypescript()} }`;
                } else {
                    throw "";
                }
            }
            case CsTypeCategory.Nullable: {
                if (this.generics.length == 1) {
                    return `${this.generics[0].convertToTypescript()} | null`;
                }
                else {
                    throw "";
                }
            }
            case CsTypeCategory.Tuple: {
                if (this.generics.length == 0)
                    throw "";
                let x: { Item1: number, Item2: boolean };
                let tupleElements = this.generics.map((v, i) => `Item${i + 1}: ${v.convertToTypescript()}`);
                let join = tupleElements.reduce((a, b) => a ? a + ", " + b : b, "");
                return `{ ${join} }`;
            }
            case CsTypeCategory.Boolean: {
                return "boolean";
            }
            case CsTypeCategory.Number: {
                return "number";
            }
            case CsTypeCategory.Date: {
                return "Date";
            }
            case CsTypeCategory.Any: {
                return "any";
            }
            case CsTypeCategory.Other: {
                if (this.generics.length > 0) {
                    var generics = this.generics.map(x => x.convertToTypescript()).reduce((a, b) => a ? a + ", " + b : b, "");
                    return `${this.name}<${generics}>`;
                } else {
                    return this.name;
                }
            }
        }
    }

    /**Convert this type to a typescript type */
    convertToTypescript(): string {
        var arrayStr = "";
        for (var a of this.array) {
            arrayStr += "[";
            for (var i = 1; i < a.dimensions; i++) {
                arrayStr += ",";
            }
            arrayStr += "]";
        }
        return this.convertToTypescriptNoArray() + arrayStr;
    }
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
export function parseType(code: string): CsType | null {
    //Remove all spaces:
    code = code.replace(" ", "");


    var patt = /([a-zA-Z0-9_]+)\s*(?:<(.*)>)?\s*(\?)?\s*(\[[,\[\]]*\])*/;

    var arr = patt.exec(code);
    if (!arr) {
        return null;
    }

    //Pattern groups:
    var name = arr[1];
    var genericsStr = splitCommas(arr[2] || "");
    var nullable = arr[3] == "?";
    var arraysStr = arr[4] || "";

    var arrays = parseArray(arraysStr);
    var generics = genericsStr.map(x => parseType(x));
    if (nullable) {
        var underlyingType = new CsType(name, generics, []);
        return new CsType(CsType.nullable, [underlyingType], arrays);
    } else {
        return new CsType(name, generics, arrays);
    }
}


