
import { any, cap, nonCap, oneOrMore, optional, seq, zeroOrMore } from "./compose";
import { identifier, space, spaceOptional } from "./regexs";
import { ExtensionConfig } from "./config";

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
    /**A 1-dimension byte array */
    ByteArray,
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

export interface CsType {
    /**Type name */
    name: string;
    /**Generic arguments */
    generics: CsType[];

    /**Neasted arrays */
    array: CsArray[];
}

/**Check if the given type is a simple that that passes as an uri parameter */
export function isUriSimpleType(x: CsType): boolean {
    const simpleCats: CsTypeCategory[] = [
        CsTypeCategory.Boolean,
        CsTypeCategory.Number,
        CsTypeCategory.Date,
        CsTypeCategory.String,
    ];

    const isSimpleCat = (x: CsTypeCategory) => simpleCats.indexOf(x) != -1;
    const typeCat = getTypeCategory(x);
    if (isSimpleCat(typeCat)) {
        return true;
    } else if (typeCat == CsTypeCategory.Nullable && isSimpleCat(getTypeCategory(x.generics[0]))) {
        return true;
    }
    return false;
}

export function getTypeCategory(x: CsType): CsTypeCategory {
    type TypeCategory = {
        category: CsTypeCategory;
        types: string[];
        genericMin: number;
        genericMax: number
    };
    const byteTypeName = ['byte', "Byte", "System.Byte"];

    //Check if the type is byteArray
    if (byteTypeName.indexOf(x.name) != -1 && x.generics.length == 0 && x.array.length == 1 && x.array[0].dimensions == 1) {
        return CsTypeCategory.ByteArray;
    }

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
                ...byteTypeName,
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

    const cat = categories.filter(cat => cat.types.indexOf(x.name) != -1 && x.generics.length >= cat.genericMin && x.generics.length <= cat.genericMax)[0];
    return cat ? cat.category : CsTypeCategory.Other;
}

export function convertToTypescript(x: CsType, config: ExtensionConfig): string {
    if(config.byteArrayToString && getTypeCategory(x) ==  CsTypeCategory.ByteArray) {
        return "string";
    }

    var arrayStr = "";
    for (var a of x.array) {
        arrayStr += "[";
        for (var i = 1; i < a.dimensions; i++) {
            arrayStr += ",";
        }
        arrayStr += "]";
    }
    return convertToTypescriptNoArray(x, config) + arrayStr;
}
function convertToTypescriptNoArray(value: CsType, config: ExtensionConfig): string {
    const category = getTypeCategory(value);
    switch (category) {
        case CsTypeCategory.Enumerable: {
            if (value.generics.length == 0) {
                return "any[]";
            } else if (value.generics.length == 1) {
                return convertToTypescript(value.generics[0], config) + "[]";
            } else {
                throw "";
            }
        }

        case CsTypeCategory.Dictionary: {
            let keyType = (getTypeCategory(value.generics[0]) == CsTypeCategory.Number) ? "number" : "string";
            return `{ [key: ${keyType}]: ${convertToTypescript(value.generics[1], config)} }`;

        }
        case CsTypeCategory.Nullable: {
            return `${convertToTypescript(value.generics[0], config)} | null`;
        }
        case CsTypeCategory.Tuple: {
            let x: { Item1: number, Item2: boolean };
            let tupleElements = value.generics.map((v, i) => `Item${i + 1}: ${convertToTypescript(v, config)}`);
            let join = tupleElements.reduce((a, b) => a ? a + ", " + b : b, "");
            return `{ ${join} }`;
        }
        case CsTypeCategory.Task: {
            const promLike = (t: string) => "Promise<" + t + ">";
            return value.generics.length == 0 ? promLike("void") : promLike(convertToTypescript(value.generics[0], config));
        }
        case CsTypeCategory.Boolean: {
            return "boolean";
        }
        case CsTypeCategory.Number:
        case CsTypeCategory.ByteArray: {
            return "number";
        }
        case CsTypeCategory.Date: {
            return config.dateToDateOrString ? "Date | string"  : "Date";
        }
        case CsTypeCategory.String: {
            return "string";
        }
        case CsTypeCategory.Any: {
            return "any";
        }
        case CsTypeCategory.Other: {
            if (value.generics.length > 0) {
                var generics = value.generics.map(x => convertToTypescript(x, config)).reduce((a, b) => a ? a + ", " + b : b, "");
                return `${value.name}<${generics}>`;
            } else {
                return value.name;
            }
        }
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
export function splitTopLevel(text: string, separators: string[], openGroup: string[] = ["[", "(", "<", "{"], closeGroup: string[] = ["]", ")", ">", "}"]): string[] {
    var ret: string[] = [];
    var level = 0;
    var current = "";
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
    return splitTopLevel(text, [","]);
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
        var underlyingType = { name, generics, array: [] };
        return {
            name: "Nullable",
            generics: [underlyingType],
            array: arrays
        };
    } else {
        return { name, generics, array: arrays }
    }
}
