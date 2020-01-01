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
export function parseDingLine(ding_line:string):DictCard {    
    let [word, translate] = ding_line.split('::');
    return [parseOrder(word), parseTranslate(translate)];
}

export function formatDictCard(c: DictCard): string {    
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
        let cssc = `ding ding-row ding-row-${idx}`;
        let row = `\n  <td class="${cssc}">${head}</td>\n  <td class="${cssc}">${translate}</td>\n`;
        result += `<tr>${row}</tr>\n`;
    } );
    return result;
}


export function formatGenus(g: Genus) {
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
    let result = parts.sort( (a,b)=> a.part.position - b.part.position )
        .map( (p) => {
            let text = p.part.text;
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