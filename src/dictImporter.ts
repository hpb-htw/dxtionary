import * as path from "path";
import { Entry, Dictionary } from "./dictionary";


/**
 * 
 * @param pathToPlainDictionary Path to origin dictionary files, which are distributed somewhere in internet.
 *      in most cases they are plain text, as TXT or XML.
 * @param parserFn(path, callback) function to parse the dictionary file with an argument as a callback 
 *          function to save entry from origin dictionary file.
 * @param dict origin dictionary file is converted and imported to this dictionary.
 * @param bufferSize defines the number of [[Entry]] in buffer before they are saved in dictionary.
 * 
 * @returns a promise, fullfilled with the number of recognized and saved entries.
 * 
 */
export async function importDict(pathToPlainDictionary: string, 
                    parserFn:(path:string, callback:(e:Entry)=>any) => Promise<number>, 
                    dict: Dictionary, 
                    bufferSize:number = 1024): Promise<number> {
    let buffer: Entry[] = [];
    //const bufferSize = 1024;
    let savedEntries = 0;
    return await parserFn(pathToPlainDictionary, async (entry: Entry) => {        
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



