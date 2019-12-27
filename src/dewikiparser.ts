//import XMLStream from "xml-stream";
const XMLStream = require("xml-stream");
//const Parser = require("node-xml-stream"); // Too slow
import * as fs from "fs";
import { Entry } from "./dictionary";


/**
 * parse a XML dump file from http://dumps.wikimedia.org/backup-index.html
 * Result of this function is a database file.
 * 
 */
export function parseWikiDump(dumpFile:string, insertEntry: (entry:Entry) => void) {
    let xmlFile = fs.createReadStream(dumpFile);
    let xml = new XMLStream(xmlFile);
    let entry:Entry = {
        word: "word",
        text: "TEXT"
    };
    let inPage = false;
    xml.preserve('text');
    /*xml.on("text: text", (element:any)=>{
        console.log(element);
    });
    */
    
    xml.on("endElement: page", (element:any) => {
        let ns = element["ns"];
        console.log({ns});
        if (ns === '0') {
            let title =  element["title"];
            console.log("===========|"+title);
            let originText = element["revision"]["text"]["$children"];
            let text = joinText(originText);
            if (title === "Januar") {
                console.log( text );
            }
        }
    });    
    
}

const entities = [
    "<", ">", "'", '"', '&'
];

function joinText(text:string[]):string {
    let cleanup:string[] = [];
    let isLookForward = false;
    let buffer: string[] = [];
    let tags:string[] = [];
    let pushTagName = false;
    for(let line of text) {
        if ( isLookForward ) {
            buffer.push(line);
        } else {
            cleanup.push(line);
        }
        if (line === "<") {            
            if (!isLookForward) {
                buffer.push(line);
                isLookForward = true;
            }
            pushTagName = true;
            continue;
        }
        if(pushTagName) {
            let tag = line.split(/\s+/)[0];
            console.log("new tag: " + tag);
            tags.push(tag);
            pushTagName = false;
        }

        if (line === ">" && isLookForward) {
            console.log("see a >");
            let tag = tags[tags.length-1];            
            let lastBuffer = buffer[buffer.length-2];
            console.log({tag, lastBuffer});
            if (lastBuffer === "/"){ // end of a single tag
                isLookForward = false;            
                let bufferLine = buffer.join("");
                console.log("single tag:---> " + bufferLine);
                cleanup.push(bufferLine);
                buffer = [];
                tags.pop();
            }else if (lastBuffer === '"' || tag === lastBuffer) { // end of a tag-open within text inside
                let bufferLine = buffer.join("");
                console.log("end of tag-open:-----> " + bufferLine);
                cleanup.push(bufferLine);
                buffer = [];
            } else {                
                if ( "/" + tag === lastBuffer ) { // end of a tag-close within text inside
                    isLookForward = false;
                    let bufferLine = buffer.join("");
                    cleanup.push(bufferLine);
                    console.log("end of tag-close: ----> " + bufferLine);
                    buffer = [];
                    tags.pop();
                } else {
                    console.log("===WTF=== why I see " + lastBuffer);
                }
            }
        }
    }
    return cleanup.join("\n");
}