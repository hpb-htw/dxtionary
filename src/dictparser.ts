//import XMLStream from "xml-stream";
const XMLStream = require("xml-stream");
import * as fs from "fs";
import * as es from "event-stream";
import * as path from "path";

import { Entry, Dictionary } from "./dictionary";

/**
 * 
 * @param dingDictPath path to ding dictionary file, can be downloaded from ....
 * @param insertEntry a callback function which can process a line in the ding dictionary file.
 */
export async function parseDingDictionary(dingDictPath: string, insertEntry: (entry: Entry) => any): Promise<number> {
    let lineNr = 0;
    let promisses = new Promise<number>((resolve, reject) => {
        let s = fs.createReadStream(dingDictPath, { flags: 'r' })
            .pipe(es.split())
            .pipe(es.mapSync(async function (line: string) {
                if (!line.startsWith("#") && line.trim().length > 0) {
                    s.pause();
                    lineNr++;
                    await insertEntry({ id: lineNr, text: `${line}` });
                    s.resume();
                }                
            }))
            //.pipe(process.stdout)
            .on('error', function (err) {
                reject(err);
            })
            .on('end', function () {
                resolve(lineNr);
            });
    });
    return promisses;
}

/**
 * 
 * @param dingDictPath Path to origin dictionary files, which are distributed somewhere in internet.
 * @param parserFn(path, callback) function to parse the dictionary file with an argument as a callback 
 *          function to save entry from origin dictionary file.
 * @param dict origin dictionary file is converted and imported to this dictionary.
 * @param bufferSize defines the number of [[Entry]] in buffer before they are saved in dictionary.
 * 
 * @returns a promise, fullfilled with the number of recognized and saved entries.
 * 
 */
export async function importDict(dingDictPath: string, 
                    parserFn:(path:string, callback:(e:Entry)=>any) => Promise<number>, 
                    dict: Dictionary, 
                    bufferSize:number = 1024): Promise<number> {
    let buffer: Entry[] = [];
    //const bufferSize = 1024;
    let savedEntries = 0;
    return await parserFn(dingDictPath, async (entry: Entry) => {        
        buffer.push(entry);       
        if (buffer.length === bufferSize) {        
            let r = await dict.saveAll(buffer);
            savedEntries += r;
            buffer = [];    
        }
    }).then( (lineNr) => {        
        if (buffer.length > 0) {
            return dict.saveAll(buffer);
        } else {
            return 0;
        }
    }).then( (lastChunk) => {        
        return savedEntries + lastChunk;
    } );
}

export function constructDbPath(originPath: string, targetDirectory: string): string {
    let originFileName = path.basename(originPath);    
    return path.join(targetDirectory, originFileName + ".db");
}

/**
 * parse a XML dump file from http://dumps.wikimedia.org/backup-index.html
 * Result of this function is a Promise. See Unit test for Usage.
 * 
 */
export async function parseWikiDump(dumpFile: string, insertEntry: (entry: Entry) => any):Promise<number> {
    let xmlFile = fs.createReadStream(dumpFile);
    let count = 0;
    let promisses = new Promise<number>((resolve, reject) => {
        let xml = new XMLStream(xmlFile);
        xml.preserve('text', true);
        xml.on("endElement: page", (element: any) => {
            let ns = element["ns"];
            if (ns === '0') {
                ++count;
                let title = Number.parseInt(element["id"]);
                let originText = element["revision"]["text"]["$children"];
                try {
                    let text = joinText(originText);                    
                    insertEntry({
                        id: title,
                        text: text
                    });
                } catch (ex) {                    
                    reject(ex);
                }
            }
        });
        xml.on("end", () => {
            resolve(count);
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

