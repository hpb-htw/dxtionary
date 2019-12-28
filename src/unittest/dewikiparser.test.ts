import * as assert from "assert";
import * as path from "path";

import {parseWikiDump} from "../dewikiparser";
import {Entry} from "../dictionary";

let bigDumpXML =   "../../big-file/dewiktionary-20191020-pages-articles.xml";
let smallDumpXML = "../../big-file/small-dewiktionary-20191020-pages-articles.xml";

test('parse xml dump', async () => {
    let xmlPath = path.join(__dirname, smallDumpXML);
    let result: any[] = [];
    await parseWikiDump(xmlPath,  (entry) => {
        result.push(entry);
    });
    console.log({result});
    assert.ok(true, "Done");
});
