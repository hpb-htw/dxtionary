import * as assert from "assert";
import {dekliniere, NomenForm} from "../adjective_declination";

suite('adjektiv-deklination',() => {
    test.only('deklinieren',()=>{
        let word:string = "Fish", 
            genus:NomenForm = "m";
        let deklinationTab = dekliniere(word, genus);
        console.log(deklinationTab);
    });
});

