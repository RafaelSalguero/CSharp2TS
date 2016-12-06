//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as extension from '../src/extension';

// Defines a1 Mocha test suite to group tests of similar k1ind together
suite("Extension Tests", () => {


    test("Auto property test", () => {
        var testPairs: { inputs: string[], output: string }[] = [
            {
                inputs: ["int  Age  { get;   set;  }", "int Age {get;set;}", "int Age{get;set;}"],
                output: "Age: number;"
            },
            {
                inputs: ["MyClass<string, OtherClass<object, C2>> Generic { get; set; }"],
                output: "Generic: MyClass<string, OtherClass<any, C2>>;"
            },
            {
                inputs: ["MyClass<string[], OtherClass<object, C2>>[][] Generic { get; set; }"],
                output: "Generic: MyClass<string[], OtherClass<any, C2>>[][];"
            },
            {
                inputs: ["string[] names { get; set;}", "string  [] names { get; set;}", "string  [] names => rafa;"],
                output: "names: string[];"
            },
            {
                inputs: ["string[,][,,,] names { get; set;}"],
                output: "names: string[,][,,,];"
            },
            {
                inputs: ["List<string> List { get; set; }"],
                output: "List: string[];"
            },
            {
                inputs: ["int ? PropName { get; set; }"],
                output: "PropName: number | null;"
            },
            {
                inputs: ["int ? PropName { get; set; }"],
                output: "PropName: number | null;"
            },
            {
                inputs: ["Tuple<int, bool[]> PropName { get; set; }", "Tuple<int, List<bool>> PropName { get; set; }"],
                output: "PropName: { Item1: number, Item2: boolean[] };"
            },
            {
                inputs: ["Dictionary<string, Tuple<int, bool?, string>> PropName { get; set; }"],
                output: "PropName: { [key: string]: { Item1: number, Item2: boolean | null, Item3: string } };"
            },
            {
                inputs: ["Tuple<int, Dictionary<object, List<Tuple<int, bool?>>>> PropName { get; set; }", "Tuple<int, Dictionary<object, List<Tuple<int, bool?>>>> PropName => hello;"],
                output: "PropName: { Item1: number, Item2: { [key: string]: { Item1: number, Item2: boolean | null }[] } };"
            },
        ];
        for (const p of testPairs) {
            for (const input of p.inputs) {
                assert.equal(extension.cs2ts(input), p.output, input);
            }
        }
    });
    // Defines a Mocha unit test
    test("Something 1", () => {
        assert.equal(-1, [1, 2, 3].indexOf(5));
        assert.equal(-1, [1, 2, 3].indexOf(0));
    });
});