//import XMLStream from "xml-stream";
const XMLStream = require("xml-stream");
//const Parser = require("node-xml-stream"); // Too slow
import * as fs from "fs";
import * as es from "event-stream";

import { Entry } from "./dictionary";

export async function parseDingDictionary(dingDictPath: string, insertEntry: (entry: Entry) => any): Promise<any> {
    let lineNr = 0;    
    let promisses = new Promise((resolve, reject) => {
        fs.createReadStream(dingDictPath, { flags: 'r' })
            .pipe(es.split())
            .pipe(es.map(function (line: string, callback: any) {
                if (line.startsWith("#")||line.trim().length === 0) {
                    callback();
                } else {
                    lineNr++;
                    insertEntry({ word: `word ${lineNr}`, text: `${line}` });
                    callback(null, `${lineNr}\n`);
                }
            })
                .on('error', function (err) {
                    reject(err);
                })
                .on('end', function () {
                    resolve(lineNr);
                })
            );
    });
    return promisses;
}

/**
 * parse a XML dump file from http://dumps.wikimedia.org/backup-index.html
 * Result of this function is a Promise. See Unit test for Usage.
 * 
 */
export async function parseWikiDump(dumpFile: string, insertEntry: (entry: Entry) => any) {
    let xmlFile = fs.createReadStream(dumpFile);
    let promisses = new Promise((resolve, reject) => {
        let xml = new XMLStream(xmlFile);
        xml.preserve('text', true);
        xml.on("endElement: page", (element: any) => {
            let ns = element["ns"];
            if (ns === '0') {
                let title = element["title"];
                let originText = element["revision"]["text"]["$children"];
                try {
                    let text = joinText(originText);
                    //console.log( text );
                    insertEntry({
                        word: title,
                        text: text
                    });
                } catch (ex) {
                    console.log(ex);
                    reject(ex);
                }
            }
        });
        xml.on("end", () => {
            resolve("done");
        });
    });
    return promisses;
}

function joinText(text: string[]): string {
    return text.map((line) => escape(line)).join("");
}

// XML entities.
var entities: { [index: string]: string } = {
    '"': '&quot;',
    '&': '&amp;',
    '\'': '&apos;',
    '<': '&lt;',
    '>': '&gt;'
};

// Escapes text for XML.
function escape(value: string) {
    return value.replace(/"|&|'|<|>/g, function (entity) {
        return entities[entity];
    });
}

