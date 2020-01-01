const Datastore = require('nedb');

export type Entry = {
    /**
     * unique id of the entry in a dictionary
     */
    id: number,
    /**
     * text description about the entry
     */
    text: string,
};

export const DbEntrySchema = {
    id: Number,
    text: String
};

export const idMap = (word: string, entries: Entry[]) =>
    `${word}\n${entries.map(e => e.text).join('\n')}`;

export interface Dictionary {
    /**
     * 
     * @param word searching word in dictionary database
     * @returns a Promise of String. This String is ready to be shown on the client of 
     * this dictionary.
     */
    query(word: string): Promise<string>;

    /**
     * @param entry the entry to be saved into dictionary database.
     */
    save(entry: Entry): Promise<any>;

    saveAll(entries: Entry[]): Promise<number>;
    /**
     * clients of a dictionary must call this method when they don't need this dictionary any more.
     * Clients expect that this method release all resource which are bound to this dictionary.
     * 
     * @returns a Promiss, expected to be resolved if sussess, or rejected of closing dictionary 
     * causes problems.
     */
    close(): Promise<any>;
}


export class NeDBDictionary implements Dictionary {

    db: any;
    
    /** function to rendern an array of Entry */    
    entitiesMap:(word: string, entities: Entry[]) => string
        = idMap;

    constructor(dbPath:string) {
        this.db = new Datastore( {filename:dbPath, autoload:true} );
    }

    query(word: string): Promise<string> {
        let reg = new RegExp(word, 'i');
        return new Promise((resolve, reject)=> {
            this.db.find({text: {$regex: reg }}, (err:any, doc:any)=> {
                if (err) {
                    reject(err);
                }else {                    
                    resolve(this.entitiesMap(word, doc));
                }
            });
        });
    } 
    
    
    save(entry: Entry): Promise<any> {
        return new Promise((resolve, reject)=> {
            this.db.insert(entry, (err:any, doc:any)=> {
                if (err){
                    reject(err);
                }else {
                    resolve(doc);
                }
            });
        });
    }


    saveAll(entries: Entry[]): Promise<number> {
        return new Promise((resolve, reject)=> {
            this.db.insert(entries, (err:any, doc:any)=> {
                if (err){
                    reject(err);
                }else {
                    resolve(entries.length);
                }
            });
        });
    }


    close(): Promise<any> {
        return new Promise((resolve, reject)=> {
            resolve(true);
        });
    }
}

//TODO: parse each line to readable text
export function dingLineParser(word:string,  entries: Entry[]):string {
    let lines: string = '<table>\n';
    for(let l of entries) {        
        let [wordHead, wordTail] = l.text.split('::');
        let row = `<tr>
                      <td>${wordHead}</td>
                      <td>${wordTail}</td>
                    </tr>\n`;
        lines += row;
    }
    return lines + '</table>\n';
}