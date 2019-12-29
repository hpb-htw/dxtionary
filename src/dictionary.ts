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

function identity_map(entries: Entry[]): string {
    return entries.map(e => e.text).join("\n");
}

export class DeWiktionary implements Dictionary {

    globalDb: Trilogy;
    privateDb?: Trilogy;
    projectDb?: Trilogy;
    
    /*@readonly*/
    tableName = "dic";

    /** function to rendern an array of Entry */
    entitiesMap: (entities: Entry[]) => string;

    /**
     * 
     * @param globalDictDatabase path to a Ding file database, which is used as global 
     *          (original from somewhere in internet; contains well-known entry)
     * @param privateDictDatabase path to a Ding file database, which is used as private dictionary
     *          (contains only user-customized entry)
     * @param projectDictDatabase path to a Ding file database, which is customized in for the underlying 
     *          project (contains only project specified entry)
     * 
    */
    constructor(globalDictDatabase: string, privateDictDatabase?: string, projectDictDatabase?: string) {        
        this.globalDb = connect(globalDictDatabase, {
            client: 'sql.js'
        });
        
        if(privateDictDatabase) {
            this.privateDb = connect(privateDictDatabase, {
                client: 'sql.js'
            });            
        }
        if(projectDictDatabase) {
            this.projectDb = connect(projectDictDatabase, {
                client: 'sql.js'
            });
        }

        this.entitiesMap = identity_map;            
    }

    async query(word: string): Promise<string> {
        const globalDict = await this.globalDb.model<Entry>(this.tableName, DbEntrySchema);
        let result = await globalDict.find(["text", "like", `%${word}%`]);        
        return this.entitiesMap(result);
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
            //console.log(`created ${entries.length} entries`);
            return entries.length;
        });
    }

    async close() {
        //TODO check if databases are already closed.
        let p = [this.globalDb.close().then( ()=> {
            console.log("Global db closed");
        })];
        if (this.privateDb) {
            p.push(this.privateDb.close());
        }
        if (this.projectDb) {
            p.push(this.projectDb.close());
        }
        return await Promise.all(p);
    }
}
