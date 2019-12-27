export type Entry = {
    word: string,
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
            word : word,
            text : "TODO"
        };
    }

}
