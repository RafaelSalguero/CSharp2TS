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
     //'signature' to emit a method signature, 'lambda' to emit a lambda function. 'controller' to emit a lambda to call an async controller
     "csharp2ts.methodStyle": 'signature',
     //True to convert C# byte array type to Typescript string, defaults to true since the serialization of C# byte[] results in a string
     "csharp2ts.byteArrayToString": true,
     //"True to convert C# DateTime and DateTimeOffset to Typescript (Date | string), defaults to true since the serialization of C# DateTime results in a string"s
     "csharp2ts.dateToDateOrString": true,
     /*Modifiers to remove. Ex. if you want to remove private and internal members set to ['private', 'internal']*/
     "csharp2ts.removeModifiers": [],
     /*If setted, any property or field that its name matches the given regex will be removed, Ex. if you want to remove backing fields starting with underscore set to "_[a-z][a-zA-Z0-9]*" */
     "csharp2ts.removeNameRegex": "",
     /*True to convert classes to interfaces, false to convert classes to classes. Default is true*/
     "csharp2ts.classToInterface": true,
     /*True to preserve fields and property modifiers. Default is false*/
     "csharp2ts.preserveModifiers": false
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
- Support for the `Task` type

### 0.0.18
- Bug fix: Support for international characters on identifiers

### 0.0.19
- Bug fix: Support for international characters on type names

#### 0.0.20
- Improved attribute parsing and removing
- New method body style `controller`

#### 0.0.21
- Improved class constructor parsing
- New configuration for type generators: `byteArrayToString` and `dateToDateOrString`

#### 0.0.22
- Bug fix: Support for fields
- Bug fix: Translation was wrong on some special cases with generic types mixed with arrays
- New config: `classToInterface`. Convert `class` to `interface` or `class`
- New config: `preserveModifiers`. Preserve properties and field modifiers. 
- New config: `removeWithModifier`. Remove fields and properties with the given modifiers.
- New config: `removeNameRegex`. Remove fields and properties that its name match the given regex.

#### 0.0.23
- Improved parsing for `partial` classes and multiple inheritances

#### 0.0.24
- Bug fix: Incorrectly parsed generic type on certain conditions. Thanks @labarilem

#### 0.0.25
- Support for C# 9