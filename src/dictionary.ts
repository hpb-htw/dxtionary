import { connect, Trilogy } from 'trilogy';

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

export const idMap = (word: string, entries:Entry[]) => 
            `${word}\n${entries.map(e=>e.text).join('\n')}`;

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

    saveAll(entries: Entry[]): Promise<any>;
    /**
     * clients of a dictionary must call this method when they don't need this dictionary any more.
     * Clients expect that this method release all resource which are bound to this dictionary.
     * 
     * @returns a Promiss, expected to be resolved if sussess, or rejected of closing dictionary 
     * causes problems.
     */
    close():Promise<any>;
}


export class SqlJsDictionary implements Dictionary {

    private globalDb: Trilogy;
    
    readonly tableName = "dict";

    

    /** function to rendern an array of Entry */
    entitiesMap: (word:string, entities: Entry[]) => string;

    /**
     * 
     * @param dictionaryDatabasePath path to a Ding file database, which is used as global 
     *          (original from somewhere in internet; contains well-known entry)     
    */
    constructor(dictionaryDatabasePath: string) {        
        this.globalDb = connect(dictionaryDatabasePath, {
            client: 'sql.js'
        });
        this.entitiesMap = idMap;
    }

    async query(word: string): Promise<string> {
        const globalDict = await this.globalDb.model<Entry>(this.tableName, DbEntrySchema);
        let result = await globalDict.find(["text", "like", `%${word}%`]);        
        return this.entitiesMap(word, result);
    }

    async save(entry: Entry) {        
        const globalDict = await this.globalDb.model<Entry>(this.tableName, DbEntrySchema);        
        return await globalDict.create(entry);
    }

    async saveAll(entries: Entry[]){
        const globalDict = await this.globalDb.model<Entry>(this.tableName, DbEntrySchema);
        let promises:Promise<any>[] = [];
        for(let entry of entries) {            
            promises.push(globalDict.create(entry));
        }
        return await Promise.all(promises).then( ()=>{            
            return entries.length;
        });
    }

    async close() {                
        return await this.globalDb.close().then( ()=> {
            console.log("connection to db closed");
            return true;
        });
    }
}

