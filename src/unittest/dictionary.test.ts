import * as assert from "assert";
import * as fs from "fs";

import {DeWiktionary, Entry} from "../dictionary";

const globalDbPath = "/tmp/somepath.db";
const entries: Entry[] = [
    {id: 1, text: "hello "},
    {id: 2, text: "test"}
];
suite('dictionary', () => {

    setup( ()=> {
        try{
            fs.unlinkSync(globalDbPath);
        }catch(ex) {
            // ignore it
        }
    });

    test('create some entries', async()=> {
        let dict = new DeWiktionary(globalDbPath);
        let count = await dict.saveAll(entries);
        await dict.close();
        assert.equal(count, entries.length);
        assert.ok("Done");
    });

    test('query a word', async ()=>{
        let dict = new DeWiktionary(globalDbPath);
        await dict.saveAll(entries);
        let word = "test";
        let result = await dict.query("test");
        console.log(result);
        dict.close();
        assert.equal(result, word);
    });

});
