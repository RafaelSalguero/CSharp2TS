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
- Support for cammelCase/PascalCase