
import { any, cap, nonCap, oneOrMore, optional, seq, zeroOrMore } from "./compose";
import { identifier, space, spaceOptional } from "./regexs";

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
    /**A string type */
    String,
    /**Any type */
    Any,
    /**Unidentified type */
    Other,
    /**Task/promise task */
    Task
}

/**A c# type */
export class CsType {
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

    /**Gets the type category */
    get category(): CsTypeCategory {
        type TypeCategory = {
            category: CsTypeCategory;
            types: string[];
            genericMin: number;
            genericMax: number
        };

        const categories: TypeCategory[] = [
            {
                category: CsTypeCategory.Enumerable,
                types: ["List", "ObservableCollection", "Array", "IEnumerable", "IList", "IReadOnlyList", "Collection", "ICollection", "ISet", "HashSet"],
                genericMin: 0,
                genericMax: 1
            }, {
                category: CsTypeCategory.Nullable,
                types: ["Nullable", "System.Nullable"],
                genericMin: 1,
                genericMax: 1
            }, {
                category: CsTypeCategory.Dictionary,
                types: ["Dictionary", "IDictionary", "IReadOnlyDictionary"],
                genericMin: 2,
                genericMax: 2
            }, {
                category: CsTypeCategory.Boolean,
                types: ["bool", "Boolean", "System.Boolean"],
                genericMin: 0,
                genericMax: 0
            }, {
                category: CsTypeCategory.Number,
                types: [
                    'int', "Int32", "System.Int32",
                    'float', "Single", "System.Single",
                    "double", "Double", "System.Double",
                    'decimal', "Decimal", "System.Decimal",
                    'long', "Int64", "System.Int64",
                    'byte', "Byte", "System.Byte",
                    'sbyte', "SByte", "System.SByte",
                    'short', "Int16", "System.Int16",
                    'ushort', "UInt16", "System.UInt16",
                    'ulong', "UInt64", "System.UInt64"
                ],
                genericMin: 0,
                genericMax: 0
            }, {
                category: CsTypeCategory.Date,
                types: ["DateTime", "System.DateTime", "DateTimeOffset", "System.DateTimeOffset"],
                genericMin: 0,
                genericMax: 0
            }, {
                category: CsTypeCategory.String,
                types: ["Guid", "string", "System.String", "String"],
                genericMin: 0,
                genericMax: 0,
            }, {
                category: CsTypeCategory.Any,
                types: ["object", "System.Object", "dynamic"],
                genericMin: 0,
                genericMax: 0,
            }, {
                category: CsTypeCategory.Task,
                types: ["Task", "System.Threading.Tasks.Task"],
                genericMin: 0,
                genericMax: 1
            }, {
                category: CsTypeCategory.Tuple,
                types: ["Tuple", "System.Tuple"],
                genericMin: 1,
                genericMax: 1000
            }
        ];

        const cat = categories.filter(cat => cat.types.indexOf(this.name) != -1 && this.generics.length >= cat.genericMin && this.generics.length <= cat.genericMax)[0];
        return cat ? cat.category : CsTypeCategory.Other;
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
                let keyType = (this.generics[0].category == CsTypeCategory.Number) ? "number" : "string";
                return `{ [key: ${keyType}]: ${this.generics[1].convertToTypescript()} }`;

            }
            case CsTypeCategory.Nullable: {
                return `${this.generics[0].convertToTypescript()} | null`;
            }
            case CsTypeCategory.Tuple: {
                let x: { Item1: number, Item2: boolean };
                let tupleElements = this.generics.map((v, i) => `Item${i + 1}: ${v.convertToTypescript()}`);
                let join = tupleElements.reduce((a, b) => a ? a + ", " + b : b, "");
                return `{ ${join} }`;
            }
            case CsTypeCategory.Task: {
                const promLike = (t: string) => "Promise<" + t + ">";
                return this.generics.length == 0 ? promLike("void") : promLike(this.generics[0].convertToTypescript());
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
            case CsTypeCategory.String: {
                return "string";
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

    const patt = seq(
        cap(identifier),
        spaceOptional,
        optional(/<(.*)>/),
        spaceOptional,
        cap(optional(/\?/)),
        spaceOptional,
        zeroOrMore(cap(/\[[,\[\]]*\]/))
    );

    const arr = patt.exec(code);
    if (!arr) {
        return null;
    }

    //Pattern groups:
    const name = arr[1];
    const genericsStr = splitCommas(arr[2] || "");
    const nullable = arr[3] == "?";
    const arraysStr = arr[4] || "";

    const arrays = parseArray(arraysStr);
    const genericsOrNull = genericsStr.map(x => parseType(x));
    const genericParseError = genericsOrNull.filter(x => x == null).length > 0;

    if (genericParseError) return null;
    const generics = genericsOrNull.map(x => x!);


    if (nullable) {
        var underlyingType = new CsType(name, generics, []);
        return new CsType("Nullable", [underlyingType], arrays);
    } else {
        return new CsType(name, generics, arrays);
    }
}
