import { Order, parseDingLine, DictCard, Extension, formatDictCard, Family, Genus } from "./dingstructure";

const Datastore = require('nedb');

import * as util from 'util';
const _toTrace = (what: any, depth: number = 0) =>
    util.inspect(what, {
        showHidden: false,
        depth: (depth <= 0) ? null : depth
    });


export type Entry = {
    /**
     * unique id of the entry in a dictionary
     */
    id: number,
    /**
     * text description about the entry, this is the content of the dictionary
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
    entitiesMap: (word: string, entities: Entry[]) => string
        = idMap;

    constructor(dbPath: string) {
        this.db = new Datastore({ filename: dbPath, autoload: true });
    }

    async query(word: string): Promise<string> {
        let reg = new RegExp(escapeRegExp(word), 'i');        
        return new Promise((resolve, reject) => {
            this.db.find({ text: { $regex: reg } })
                //.limit(32)
                .exec((err: any, doc: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.entitiesMap(word, doc));
                    }
                });
        });
    }


    save(entry: Entry): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.insert(entry, (err: any, doc: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(doc);
                }
            });
        });
    }


    saveAll(entries: Entry[]): Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.insert(entries, (err: any, doc: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(entries.length);
                }
            });
        });
    }

    close(): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }
}

type PriorityDictCard = {
    priority: number, // 0 to 100, 100 is most priority
    card: DictCard
};

export const dingLineParser = (word: string, entries: Entry[]): string => {
    if(entries.length > 0) {
        let pDictCard: string =
            entries.map((e: Entry, i: number) => parseDingLine(e.text, i))
                .map((c: DictCard) => estimatePriority(c, word))
                .sort((a: PriorityDictCard, b: PriorityDictCard) => b.priority - a.priority)
                .map((dc: PriorityDictCard) => dc.card)
                .map((sc: DictCard) => formatDictCard(word, sc))
                .join("\n\n");
        return pDictCard;
    }else {
        return `<span class="ding ding-not-found">Kein Ergebnis für den Such nach ${word}</span>`;
    }
};

function estimatePriority(card: DictCard, word: string): PriorityDictCard {
    let origin: Order = card[0];
    let priority = -100; // lowest priority        
    let penalty = 0;
    const lowerWord = word.toLocaleLowerCase("de");

    // pull-up noun, sothat the {pl} form is show at top
    function bonusPriority(genus:Genus, i:number): number {
        if (isSingularNoun(genus)) {
            const nextFamily = origin[i + 1];
            if (nextFamily) {
                // pull-up noun, sothat the {pl} form is show at top
                if (isPluralForm(nextFamily[0])) {
                    return 20;
                }
            }
        }
        return 0;
    }
    for (let [i, family] of origin.entries()) {
        let isPrioritySet = false;
        for (let genus of family) {
            const orthography = genus.orthography.text;
            const lowerOrth = orthography.toLocaleLowerCase("de");
            // exact match
            if (orthography === word) {
                priority = 100 - penalty + bonusPriority(genus, i);                
                isPrioritySet = true;
                break;
            } // ignore case match 
            else if (lowerOrth === lowerWord) {
                priority = 90 - penalty + bonusPriority(genus, i);                
                isPrioritySet = true;
                break;
            } // contain word
            else if (orthography.search(word) >= 0) {
                priority = 80 - penalty;
                isPrioritySet = true;
                break;
            } // contain word ignore case
            else if (lowerOrth.search(lowerWord) >= 0) {
                priority = 70 - penalty;
                isPrioritySet = true;
                break;
            } // test in extension                
            penalty += 3;
        }
        // cannot set priority by orthography
        if (isPrioritySet) {
            break;
        } else {
            penalty += 5;
            // set priority wia extensions
            for (let genus of family) {
                for (let e of genus.extension) {
                    const text: string = e.text;
                    const lowerText = text.toLocaleLowerCase("de");
                    if (text === word) {
                        priority = 60 - penalty;
                        break;
                    } else if (lowerWord === lowerWord) {
                        priority = 50 - penalty;
                        break;
                    } else if (text.search(word) >= 0) {
                        priority = 40 - penalty;
                        break;
                    } else if (lowerText.search(lowerWord) >= 0) {
                        priority = 30 - penalty;
                        break;
                    }
                }
                penalty += 3;
            }
        }
    }
    if (priority < -100) {
        priority = -100;
    }
    return { priority, card };
}

function isSingularNoun(genus: Genus): boolean {
    const gender = genus.partOfSpeech?.text;
    const singularForm = [
        "m", "n", "m/f", "m/n"
    ];
    if (gender) {
        return singularForm.includes(gender);
    } else {
        return false;
    }
}

function isPluralForm(genus: Genus | undefined): boolean {
    if (genus) {
        const gender = genus.partOfSpeech?.text;
        if (gender) {
            return gender === "pl";
        } else {
            return false;
        }
    } else {
        return false;
    }
}


export function escapeRegExp(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}