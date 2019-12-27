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
    xml.preserve('text');    
    
    xml.on("endElement: page", (element:any) => {
        let ns = element["ns"];
        console.log({ns});
        if (ns === '0') {
            let title =  element["title"];
            console.log("===========|"+title);            
            let originText = element["revision"]["text"]["$children"];
            try{
                let text = joinText(originText);
                //if (title === "ordo") {
                    console.log( text );
                //}
            }catch(ex) {
                console.log(ex);
            }
        }
    });    
    
}



function joinText(text:string[]):string {
    let cleanup:string[] = [];
    let xmlTag:string[] = [];
    let onBuildXmlTag = false;
    let inXMLElement = false;
    let xmlElement:string[][] = [];
    for(let line of text) {
        let preProcess = line;
        if (line === "<") {
            onBuildXmlTag = true;
        } else if (line === ">") {
            onBuildXmlTag = false;
            let currentXMLTag = xmlTag.join("") + line;
            //console.log("currentXMLTag: " + currentXMLTag);
            xmlTag = [];
            if (isXMLOpenTag(currentXMLTag)) {
                inXMLElement = true;
                let currentElement = [currentXMLTag];
                xmlElement.push(currentElement);                
                continue;
            } else if (isXMLCloseTag(currentXMLTag)) {
                let currentElement = xmlElement.pop();                
                currentElement!.push(currentXMLTag); // verdammt scheiße check
                let elementText = currentElement!.join("");
                inXMLElement = xmlElement.length > 0;
                //console.log(`-----------> xmlElement.length ${xmlElement.length} ` + elementText);
                //continue;
                preProcess = elementText;
            } else if(isXMLSimpleTag(currentXMLTag)){
                //console.log(`-----------> single element  ` + currentXMLTag);
                preProcess = currentXMLTag;
                //continue;
            } else {
                //console.log("Cannot recognize tag " + currentXMLTag);
                continue;
            }
        }

        if (onBuildXmlTag) {
           //xmlTag.push(line);
            pushOrAppend(line, xmlTag);
        } else if (inXMLElement) { // not by building a xml tag (open or close)
            let topXMLElement = xmlElement[xmlElement.length - 1];
            pushOrAppend(line, topXMLElement);
        } else {
            //cleanup.push(preProcess);
            pushOrAppend(preProcess, cleanup);
        }
    }
    return cleanup.join("\n");
}

function isXMLOpenTag  (xmlTag:string) : boolean {
    return xmlTag.search("</") === -1 && xmlTag.search("/>")===-1;
}

function isXMLCloseTag(xmlTag:string):boolean {
    return xmlTag.startsWith("</");
}

function isXMLSimpleTag(xmlTag:string):boolean {
    return xmlTag.endsWith("/>");
}


function pushOrAppend(line:string,target:string[]) {
    if(line === "&") {
        let lastElement = target[target.length-1];
        lastElement += line;
        target[target.length-1] = lastElement;        
    }else if (line.startsWith("{{") || line.startsWith("==== {{")) {
        console.log("-------> append extra newline" + "\n" + line );
        target.push("\n");
        target.push(line);
        // console.log(target);
    } else {
        target.push(line);
    }
}