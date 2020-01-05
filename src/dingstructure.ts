import { escapeRegExp, Entry } from "./dictionary";
import * as fs from "fs";
import * as es from "event-stream";
/**
 * intended to be used only in [dictionary.ts], not subject of public use.
 * 
 * `export` is only for unit test.
 */

export interface Genus {
    orthography    :Orthography;
    partOfSpeech   :PartOfSpeech|undefined;   // part in {}
    domain         :Domain[];                 // part in []
    extension      :Extension[];              // part in ()
}

type _GenusPart = {
    position:number,
    text:string
};
export type Extension = _GenusPart;
export type PartOfSpeech = _GenusPart;
export type Domain = _GenusPart;
export type Orthography = _GenusPart;


export type Family = Genus[];
export type Order = Family[];
export type DictCard = [Order, Order];

/*public*/
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
                    let title = line.split(/\s+/)[0];
                    await insertEntry({ id: lineNr, title, text: `${line}` });
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






/*public*/
export function parseDingLine(ding_line:string, lineCount=-1):DictCard {    
    let [word, translate] = ding_line.split('::');    
    return [parseOrder(word), parseTranslate(translate)];
}

export function formatDictCard(word:string, c: DictCard): string {    
    let h = c[0], 
        t = c[1];    
    let formatedTranslate: string[] = t.map( (f:Family) => {
        return f.map( (g:Genus) => formatGenus(word, g) ).join("; ");
    });        
    let result = "";
    h.map( (f:Family) => {
        return f.map( (g:Genus) => formatGenus(word, g) ).join("; ");
    }).forEach( (head,idx) => {
        let translate = (idx < formatedTranslate.length) ? formatedTranslate[idx]: "";
        let cssc = `ding ding-row ding-row-${idx}`;
        let row = `\n  <td class="${cssc}">${head}</td>\n  <td class="${cssc}">${translate}</td>\n`;
        result += `<tr>${row}</tr>\n`;
    } );
    return result;
}


export function formatGenus(word: string, g: Genus) {
    enum PartName  {
        ORTH = "orthography",
        POS = "partOfSpeech",
        DOMAIN = "domain",
        EXT = "extension"
    }
    type FlatPart = {
        name:PartName, part: _GenusPart
    };
    
    let parts: FlatPart[] = [];
    parts.push({name:PartName.ORTH, part: g.orthography});
    if(g.partOfSpeech) {
        parts.push({name: PartName.POS, part:g.partOfSpeech});
    }
    g.domain.forEach( d => parts.push({
        name:PartName.DOMAIN, "part":d
    }) );
    g.extension.forEach( e => parts.push({
        name:PartName.EXT, 
        part:e
    }) );
    const safeWord = escapeHtml(word);
    const reg = new RegExp(escapeRegExp(safeWord), 'i');
    const hlSpan = '<span class="ding ding-hl">$&</span>';
    let result = parts.sort( (a,b)=> a.part.position - b.part.position )
        .map( (p) => {
            let text = escapeHtml(p.part.text);
            text = text.replace(reg, hlSpan);
            switch(p.name) {
                case PartName.DOMAIN: text = `[${text}]`; break;
                case PartName.POS   : text = `{${text}}`; break;
                case PartName.EXT   : text = `(${text})`; break;
                case PartName.ORTH:
                default: {
                    //Ignore
                }
            }
            return `<span class="ding ding-part-${p.name}">${text}</span>`;
        })
        .join(" ");
    return result;    
}

export function parseOrder(order:string): Order {
    let result:Family[] = [];
    for(let f of order.split(' | ')) {
        result.push(parseFamily(f));
    }
    return result;
}

export function parseFamily(family:string): Family {
    let fam:Family = [];
    for (let g of family.split("; ")) {        
        fam.push(parseGenus(g));
    }
    return fam;
}

export function parseGenus(genus:string):Genus {
    let orthography:Orthography = {position:-1, text:""},
        part_of_speech:PartOfSpeech|undefined = undefined,
        domain: Domain[] = [] ,
        extension: Extension[] = []
    ;
    let inOrthography = true,
        inPartOfSpeech = false,
        inDomain = false,
        inExtend = false;
    let cleanupGenus = genus.trim();
    Array.from(cleanupGenus).forEach( (c, i) => {        
        if(c === "{") {
            inPartOfSpeech = true;
            inOrthography = inDomain = inExtend = false;
            part_of_speech = {position: i, text : ""};
        } else if (c === "}") {
            inPartOfSpeech = false;
            inOrthography = true;
        } else if (c === "[") {
            inDomain = true;
            inOrthography = inPartOfSpeech = inExtend = false;            
            domain.push({position:i, text:""});
        } else if (c=== "]") {
            inDomain = false;
            inOrthography = true;
        } else if (c === "(") {
            inExtend = true;
            inOrthography = inPartOfSpeech = inDomain = false;            
            let newExtension = {position: i, text:""};
            extension.push(newExtension);
        } else if (c === ")") {
            inExtend = false;
            inOrthography = true;
        } else if (inOrthography) {            
            orthography.text += c;
            if(orthography.position < 0) {
                orthography.position = i;
            }
        } else if (inPartOfSpeech) {        
            part_of_speech!.text += c;
        } else if (inDomain) {
            let last:Domain = domain.pop()||{position:i, text:""};
            last.text += c;
            domain.push(last);
        } else if (inExtend) {
            let last:Extension = extension.pop() || {position:i, text:""};
            last.text += c;
            extension.push(last);
        }       
    });    
    orthography.text = orthography.text.replace(/\s+/, ' ').trim();    
    return {
        orthography, 
        partOfSpeech: part_of_speech, 
        domain, 
        extension
    };
}


export function parseTranslate(translate:string|undefined): Order {
    let f:Family[] = [];
    if(translate) {
        for (let l of translate.split(' | ')) {
            let ll:Family = [];
            ll.push({
                orthography: {position:0, text:l.trim()},
                partOfSpeech: undefined, 
                domain: [],
                extension: []
            });
            f.push(ll);
        }
    } else {
        let ll:Family = [];
        ll.push({
            orthography: {position:0, text:""}, // no translation
            partOfSpeech: undefined, 
            domain: [],
            extension: []
        });
        f.push(ll);
    }
    return f;
}

function escapeHtml(unsafe:string) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }