# csharp2ts README

**How to use**
- Select the desired C# code
- Open the command pallete and run `Convert C# to TypeScript`

![animation](https://raw.githubusercontent.com/RafaelSalguero/CSharp2TS/master/images/animation.gif)

Simple C# POCOs to TypeScript converter.

Supports:
- Automatic properties
- Remove attributes
- Detect common types such as int, long, ... 

## Settings
On your workspace or user `settings.json`:

```js
// Place your settings in this file to overwrite default and user settings.
{
    //True for camelCase, false for preserving original name. Default is true
    "csharp2ts.propertiesToCamelCase": false,
    //Removes specified postfixes from property names, types & class names. Can be array OR string. Case-sensitive.
    "csharp2ts.trimPostfixes": "",
    //Whether or not trim postfixes recursive. (e.g. with postfixes 'A' & 'B' PersonAAB will become PersonAA when it's false & Person when it's true)
    "csharp2ts.recursiveTrimPostfixes": false,
    //Ignore property initializer    
    "csharp2ts.ignoreInitializer": true
    //True to remove method bodies, false to preserve the body as-is
     "csharp2ts.removeMethodBodies": true,
     //True to remove class constructors, false to treat then like any other method
     "csharp2ts.removeConstructors": false,
     //'signature' to emit a method signature, 'lambda' to emit a lambda function
     "csharp2ts.methodStyle": 'signature'
}
```

## Release Notes
### 0.0.0

- Initial release of the tool

### 0.0.3

- Support multiline automatic properties

### 0.0.4

- Added support for `bool`

### 0.0.5

- Fixed formatting differences between C# and TS
- Fixed bug where DateTime was translated to 'date' instead of 'Date'
- Added detection for scope modifiers on C# properties

### 0.0.6
### 0.0.7
- Fixed readme animation

### 0.0.8
- Bug fix: Automatic properties without any visibility modifiers where skipping line jumps

### 0.0.9
- Support for the 'new' modifier on automatic properties
- Support for C# fat arrow automatic properties

### 0.0.10
- Full C# type parser
- Support for C# generics
- Support for nullable types: Convert `int?` or `Nullable<int>` to `int | null`
- Convert C# `Dictionary<string, T>` to `{ [key: string]: T }`
- Convert C# `Tuple<TA, TB, TC>` to `{ Item1: TA, Item2: TB, Item3: TC }`
- Convert C# `List<T>` to `T[]`

### 0.0.11
- Bug fix: Getter only properties where not correctly parsed

### 0.0.12
- Support for cammelCase/PascalCase. Configurable with the `"csharp2ts.propertiesToCamelCase"` setting

### 0.0.13
- Documentation for settings added

### 0.0.14
- new `trimPostfixes` and `recursiveTrimPostfixes` config. Thanks amadare42

### 0.0.15
- `csharp2ts.propertiesToCamelCase` is set to `false` by default

### 0.0.16
- Bug fix: Property initializer correctly parsed
- New `csharp2ts.ignoreInitializer` config
- `double` correctly parsed

### 0.0.17
- Support method and constructor signature conversion and body removing
- Emit method signature or method empty implementation, see the `csharp2ts.methodStyle` configuration
- Added a C# XML Docs parser, improving generated JSDoc
- Improved code base
- Support for the `Task` tyoe