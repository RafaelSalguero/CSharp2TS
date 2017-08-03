import {
    any, cap, nonCap, oneOrMore, optional, seq, zeroOrMore, commas, neasted, str
} from "./compose";

import regexs = require("./regexs");
import { ParseResult } from "./parse";
import { ParseRegex, allMatches, TypedParserFunction, firstMatch, MultiMatchResult } from "./parser";
export interface XmlAttribute {
    name: string;
    value: string;
}
interface XmlNodeStart {
    type: "start" | "selfClosing";
    tag: string | "see";
    attributes: XmlAttribute[];
    space: string | undefined;
}
interface XmlNodeEnd {
    type: "end";
    tag: string;
    space: string | undefined;
}

interface XmlEmptyNode {
    type: "emptyNode",
    tag: string;
    space: string | undefined;
}

interface XmlDocContentLine {
    type: "docStart",
    space: string;
    content: string;
};

interface XmlContent {
    type: "content",
    text: string;
    space: undefined;
}

type XmlTag = XmlNodeStart | XmlNodeEnd | XmlEmptyNode | XmlDocContentLine | XmlContent;
interface XmlDocBlock {
    items: XmlTag[];
}

export function generateSimpleJsDoc(indent: string | undefined, content: string) {
    return indent + "/**" + content + " */";
}

/**
 * Generate a JS Doc
 * @param code 
 * @param value 
 */
export function generateJsDoc(value: XmlDocBlock) {
    const isSimpleComment = (() => {
        if (value.items.length == 3) {
            const isSummaryStart = (x: XmlTag): x is XmlNodeStart => x.type == "start" && x.tag == "summary";
            const isSummaryEnd = (x: XmlTag): x is XmlNodeEnd => x.type == "end" && x.tag == "summary";

            const start = value.items[0];
            const content = value.items[1];
            const end = value.items[2];

            if (isSummaryStart(start) && isSummaryEnd(end) && content.type == "docStart") {
                return {
                    simple: true,
                    indent: start.space,
                    content: content.content
                }
            } else {
                return false;
            }
        }

    })();

    if(isSimpleComment) {
        return generateSimpleJsDoc(isSimpleComment.indent, isSimpleComment.content);
    }

    const items = value.items;
    if (items.length == 0) return "";

    const text = items.map((x, i): string => {
        const startChar = i == 0 ? "/**" : " * ";
        switch (x.type) {
            case "start":
            case "selfClosing": {
                const char = x.space != null ? startChar : "";
                const begin = `${x.space || ""}${char}`;
                if (x.tag == "summary") {
                    return begin;
                } else {
                    return `${begin}@${x.tag} ${x.attributes.map(x => x.value).join("")} `
                }
            }
            case "end":
                return ""
            case "docStart":
                return `${x.space}${startChar}${x.content}`;
            case "emptyNode":
                return "";
            case "content":
                return x.text;
            default:
                return x;
        }
    });

    const withSpaces = items.filter(x => x && x.space != null).map(x => x!.space);
    const lastSpace = withSpaces[withSpaces.length - 1] || " ";

    const ret = text.join("") + lastSpace + " */";
    return ret;
}

/**Parse a C# XML Doc */
export function parseXmlDocBlock(code: string): ParseResult<XmlDocBlock> | null {
    const summaryBlockPatt = (() => {
        const comment = str("///");
        const line = seq(comment, /.*/);
        const lineJump = seq(regexs.lineJump, /\s*/);
        const firstLine = seq(/[ \t]*/, line);
        const nextLine = seq(lineJump, line);
        const block = seq(firstLine, zeroOrMore(nextLine));

        return block;
    })();

    const parseNodeTag = (() => {
        const parsers = [
            parseEmptyNode,
            parseNodeStart,
            parseSelfClosingNode,
            parseNodeEnd,
            parseDocStart
        ];
        return (code: string) => firstMatch<XmlTag>(code, parsers);
    })();

    const parseXml = (code: string) => allMatches(code, parseNodeTag);
    const toXmlContent = (code: string, x: ParseResult<undefined>): XmlContent => {
        return {
            space: undefined,
            text: code.substr(x.index, x.length),
            type: "content"
        };
    };

    const r = ParseRegex<XmlDocBlock>(code, cap(summaryBlockPatt), match => ({
        items: parseXml(match[1]).map(x => x.data ? x.data : toXmlContent(match[1], x as ParseResult<undefined>))
    }));

    return r;
}


const attribRegex = (captureGroups: boolean) => {
    const capFunc = captureGroups ? cap : x => x;
    const body = /[^"]*/
    return seq(regexs.spaceOptional, capFunc(regexs.identifier), regexs.spaceOptional, str("="), regexs.spaceOptional, str("\""), capFunc(body), str("\""));
}

function parseAttribute(code: string): ParseResult<XmlAttribute> | null {
    const attrib = attribRegex(true);
    return ParseRegex<XmlAttribute>(code, attrib, match => ({
        name: match[1],
        value: match[2]
    }));
}

function parseAttributes(code: string): XmlAttribute[] {
    const all = allMatches(code, parseAttribute).filter(x => x.data != undefined);
    return all.map(x => x.data!);
}

/**Encaja con el inicio de una linea de comentarios y captura la secuencia de espacios anterior a esta, incluyendo el salto de linea si es que hay */
const commentLineBegin = seq(cap(seq(optional(regexs.lineJump), regexs.spaceOptional)), str("///"), regexs.spaceOptional);

const { parseNodeStart, parseSelfClosingNode } = (() => {
    const attrib = attribRegex(false);
    const attribs = zeroOrMore(attrib);

    const nodeStart = (nodeEnd: string) => seq(optional(commentLineBegin), str("<"), cap(regexs.identifier), cap(attribs), regexs.spaceOptional, str(nodeEnd));

    const parseNode = (type: "start" | "selfClosing", nodeEnd: ">" | "/>") => (code: string) => ParseRegex<XmlNodeStart>(code, nodeStart(nodeEnd), match => ({
        space: match[1],
        tag: match[2],
        attributes: parseAttributes(match[3]),
        type: type,
    }));

    return {
        parseNodeStart: parseNode("start", ">"),
        parseSelfClosingNode: parseNode("selfClosing", "/>")
    }
})();


function parseNodeEnd(code: string): ParseResult<XmlNodeEnd> | null {
    const nodeEnd = seq(optional(commentLineBegin), str("</"), cap(regexs.identifier), regexs.spaceOptional, str(">"));
    return ParseRegex<XmlNodeEnd>(code, nodeEnd, match => ({
        space: match[1],
        tag: match[2],
        type: "end"
    }));
}

function parseEmptyNode(code: string): ParseResult<XmlEmptyNode> | null {
    const emptyBegin = seq(str("<"), cap(regexs.identifier), regexs.spaceOptional, str(">"));
    const emptyEnd = seq(str("</"), regexs.identifier, regexs.spaceOptional, str(">"));

    const patt = seq(optional(commentLineBegin), emptyBegin, regexs.spaceOptional, emptyEnd);

    return ParseRegex<XmlEmptyNode>(code, patt, match => ({
        type: "emptyNode",
        space: match[1],
        tag: match[2]
    }));
}

function parseDocStart(code: string): ParseResult<XmlDocContentLine> | null {
    const patt = seq(commentLineBegin, cap(zeroOrMore(/[^<\n\r]/)));
    return ParseRegex<XmlDocContentLine>(code, patt, match => ({
        type: "docStart",
        space: match[1],
        content: match[2]
    }));
}

const text = `
   	 /// <summary>
    /// Obtiene todos los archivo ticket de un ticket, 
    /// sin incluir su contenido <see cref="hola"/>
    /// Hola
    /// </summary>
    /// <param name="idTicket"></param>
    /// <param name="otro">Que rollo</param>
    /// <returns></returns>
   `;
parseXmlDocBlock(text);
