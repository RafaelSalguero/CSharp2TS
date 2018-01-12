
export interface ExtensionConfig {
    propertiesToCamelCase: boolean;
    trimPostfixes: string[];
    recursiveTrimPostfixes: boolean;
    ignoreInitializer: boolean;
    removeMethodBodies: boolean;
    removeConstructors: boolean;
    methodStyle: "signature" | "lambda" | "controller";
}

export const maxBodyDepth = 8;
export const maxExpressionDepth = 4;
