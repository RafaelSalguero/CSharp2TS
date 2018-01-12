
export interface ExtensionConfig {
    /**True for camelCase, false for preserving original name */
    propertiesToCamelCase: boolean;
    /**Removes specified postfixes from property names, types & class names. Can be array OR string. Case-sensitive. */
    trimPostfixes: string[];
    /**Whether or not trim postfixes recursive. (e.g. with postfixes 'A' & 'B' PersonAAB will become PersonAA when it's false & Person when it's true) */
    recursiveTrimPostfixes: boolean;
    /**ignoreInitializer */
    ignoreInitializer: boolean;
    /** True to remove method bodies, false to preserve the body as-is*/
    removeMethodBodies: boolean;
    /**True to remove class constructors, false to treat then like any other method */
    removeConstructors: boolean;
    /**'signature' to emit a method signature, 'lambda' to emit a lambda function. 'controller' to emit a lambda to call an async controller */
    methodStyle: "signature" | "lambda" | "controller";
    /**True to convert C# byte array type to Typescript string, defaults to true since the serialization of C# byte[] results in a string */
    byteArrayToString: boolean;
    /**True to convert C# DateTime and DateTimeOffset to Typescript (Date | string), defaults to true since the serialization of C# DateTime results in a string */
    dateToDateOrString: boolean;
}

export const maxBodyDepth = 8;
export const maxExpressionDepth = 4;
