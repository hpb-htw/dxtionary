export type Entry = {
    /**
     * unique id of the entry in a dictionary
     */
    id: number,
    /**
     * text description about the entry
     */
    text: string
};


export interface Dictionary {
    query (word: string ): Entry;
}


export class DeWiktionary implements Dictionary {

    globalDb: string;
    privateDb?: string;
    projectDb?: string;

    /**
     * @param globalDictDatabase
     * @param privateDictDatabase
     * @param projectDictDatabase
     * 
    */
    constructor(globalDictDatabase:string, privateDictDatabase?:string, projectDictDatabase?:string) {
        this.globalDb = globalDictDatabase;
        this.privateDb = privateDictDatabase;
        this.projectDb = projectDictDatabase;
    }


    query(word: string): Entry {
        return {
            id : 1001,
            text : "TODO"
        };
    }

}
