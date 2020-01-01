/**
 * intended to be used only in [dictionary.ts], not subject of public use.
 * 
 * `export` is only for unit test.
 */

export interface Genus {
    orthography    :string;
    part_of_speech :string; // part in {}
    domain         :string[];         // part in []
    extension      :Extension[];          // part in ()
}

export type Extension = {
    position:number,
    text:string
};
export type Family = Genus[];
export type Order = Family[];
export type Dict_Card = [Order, Order];

/*public*/
export function parseDingLine(ding_line:string):Dict_Card {
    let [word, translate] = ding_line.split('::');
    return [parseOrder(word), parseTranslate(translate)];
}

export function formatDictCard(c: Dict_Card): string {    
    let h = c[0], 
        t = c[1];    
    let formatedTranslate: string[] = t.map( (f:Family) => {
        return f.map( (g:Genus) => formatGenus(g) ).join(";");
    });        
    let result = "";
    h.map( (f:Family) => {
        return f.map( (g:Genus) => formatGenus(g) ).join(";");
    }).forEach( (head,idx) => {
        let translate = (idx < formatedTranslate.length) ? formatedTranslate[idx]: "";
        let row = `\n  <td class="ding ding-row${idx===0?"":"-indent"}">${head}</td>\n  <td>${translate}</td>\n`;
        result += `<tr>${row}</tr>\n`;
    } );
    return result;
}

export function formatGenus(g: Genus) {
    let result = `<span class="ding ding-orthography">${g.orthography}</span>`;
    let p = g.part_of_speech;
    if (p.length > 0) {        
        result += ` <span class="ding ding-part_of_speech">{${p}}</span>`;
    }
    for(let d of g.domain) {
        result += ` <span class="ding ding-domain">[${d}]</span>`;
    }
    for(let {position, text} of g.extension) {
        if (position === 0) { // prepend
            result = `<span class="ding ding-orthography">(${text})</span> ` + result;
        } else {
            result += ` <span class="ding ding-extension">(${text})</span>`;
        }
    }
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
    let orthography = "",
        part_of_speech = "",
        domain: string[] = [] ,
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
        } else if (c === "}") {
            inPartOfSpeech = false;
            inOrthography = true;
        } else if (c === "[") {
            inDomain = true;
            inOrthography = inPartOfSpeech = inExtend = false;
            domain.push("");
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
            orthography += c;
        } else if (inPartOfSpeech) {        
            part_of_speech += c;
        } else if (inDomain) {
            let last:string = domain.pop()||"";
            last += c;
            domain.push(last);
        } else if (inExtend) {
            let last:Extension = extension.pop() || {position:i, text:""};
            last.text += c;
            extension.push(last);
        }       
    });    
    orthography = orthography.replace(/\s+/, ' ').trim();
    //console.log({genus, cleanupGenus, orthography});
    return {
        orthography, 
        part_of_speech, 
        domain, 
        extension
    };
}


export function parseTranslate(translate:string): Order {
    let f:Family[] = [];
    for (let l of translate.split(' | ')) {
        let ll:Family = [];
        ll.push({
            orthography: l.trim(),
            part_of_speech: "", 
            domain: [],
            extension: []
        });
        f.push(ll);
    }
    return f;
}