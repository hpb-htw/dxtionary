import * as assert from "assert";
import {DeWiktionary, Entry} from "../dictionary";

test('query a word', ()=>{
    let dict = new DeWiktionary("somepath");
    let word = 1001;
    let result = dict.query("test");
    console.log(result);
    assert.equal(result.id, word);
});
