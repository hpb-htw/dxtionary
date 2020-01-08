const singularMaskulin = {
    nominativ: [ {artikel: "der", deklination: "e" } , {artikel:"ein",   deklination:"er"}, {artikel:"", deklination:"er"} ],
      genitiv: [ {artikel: "des", deklination: "en"} , {artikel:"eines", deklination:"en"}, {artikel:"", deklination:"en"} ],
        dativ: [ {artikel: "dem", deklination: "en"} , {artikel:"einem", deklination:"en"}, {artikel:"", deklination:"em"} ],
    akkusativ: [ {artikel: "den", deklination: "en"} , {artikel:"einen", deklination:"en"}, {artikel:"", deklination:"en"} ],
};

const singularFeminin = {
    nominativ: [ {artikel: "die", deklination: "e"} ,  {artikel:"eine",  deklination:"e"},  {artikel:"", deklination:"e"}  ],
      genitiv: [ {artikel: "der", deklination: "en"} , {artikel:"einer", deklination:"en"}, {artikel:"", deklination:"er"} ],
        dativ: [ {artikel: "der", deklination: "en"} , {artikel:"einer", deklination:"en"}, {artikel:"", deklination:"er"} ],
    akkusativ: [ {artikel: "die", deklination: "e"} ,  {artikel:"eine",  deklination:"e"},  {artikel:"", deklination:"e"}  ],
};

const singularNeutral = {
    nominativ: [ {artikel: "das", deklination: "_"} , {artikel:"ein",   deklination:"es"}, {artikel:"", deklination:"es"} ],
      genitiv: [ {artikel: "des", deklination: "_"} , {artikel:"eines", deklination:"en"}, {artikel:"", deklination:"en"} ],
        dativ: [ {artikel: "dem", deklination: "_"} , {artikel:"einem", deklination:"en"}, {artikel:"", deklination:"em"} ],
    akkusativ: [ {artikel: "das", deklination: "_"} , {artikel:"ein",   deklination:"es"}, {artikel:"", deklination:"es"} ],
};

const plural = {
    nominativ: [ {artikel: "die", deklination: "en"} , {artikel:"", deklination:"en"}],
      genitiv: [ {artikel: "der", deklination: "en"} , {artikel:"", deklination:"en"}],
        dativ: [ {artikel: "den", deklination: "en"} , {artikel:"", deklination:"en"}],
    akkusativ: [ {artikel: "die", deklination: "en"} , {artikel:"", deklination:"en"}],
};

export type NomenForm = "m"|"f"|"n"|"pl";
export const Genus:string[] = ["m", "f", "n", "pl"];

export function dekliniere(nomen:string, nomenForm:NomenForm, genitiv:string|undefined=undefined) {
    let tab:any;
    switch(nomenForm) {
        case "m": {tab = singularMaskulin;} break;
        case "f": {tab = singularFeminin;} break;
        case "n": {tab = singularNeutral;} break;
        case "pl": {tab = plural;} break;
    }
    let kasus = {
        "nominativ": "Nom.", 
        "genitiv"  : "Gen.", 
        "dativ"    : "Dat.", 
        "akkusativ": "Akk."
    }
    ;
    let table = `<table class="declination">`;
    const css:any = {
        "art": "declination declination-article",
        "dec": "declination declination-declination",
        "nom": "declination declination-noun",
        "cas": "declination declination-case"
    };
    let genitivForm = genitiv?genitiv: `${nomen}<span class="ding ding-attention">?</span>`;
    for(let [k, n] of Object.entries(kasus) ) {
        let deklination = tab[k];
        let row:string = deklination.map( (rule:any) => {
            const text = (k === "genitiv") ? genitivForm : nomen;
            return `
<td><span class="${css.art}">${rule.artikel}</span> 
    ___<span class="${css.dec}">${rule.deklination}</span>
    <span class="${css.nom}">${text}</span>
</td>`;
        }).join("");
        table += `<tr><td><span class="${css.cas}">${n}</span></td> ${row}</tr>\n`;
    }
    return table + "</table>";
}
