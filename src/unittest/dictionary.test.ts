import * as assert from "assert";
import * as fs from "fs";

import { Entry, NeDBDictionary, dingLineParser } from "../dictionary";

const globalDbPath = "/tmp/somepath.db";
const entries: Entry[] = [
    { id: 1, text: "hello" },
    { id: 2, text: "test" }
];

const TEN_SECONDS = 10 * 1000; // as "macro" to easy reading


function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


suite('NeDBDictionary', () => {
    setup(() => {
        try {
            fs.unlinkSync(globalDbPath);
        } catch (ex) {
            // ignore it
        }
    });

    test('query a word', async () => {
        let dict = new NeDBDictionary(globalDbPath);
        await dict.saveAll(entries);
        let word = "TeSt"; // keep this word mix lower and UPPER case to test query
        let result = await dict.query(word);
        //console.log(result);
        await dict.close();
        assert.equal(result, `${word}\n${word.toLowerCase()}`);
    });

    test('persistent entries', async () => {
        let dict = new NeDBDictionary(globalDbPath);
        let count = await dict.saveAll(entries);
        await dict.close();
        assert.equal(count, entries.length);
        // now open again, dictionary must contain entries
        let reopenDict = new NeDBDictionary(globalDbPath);
        let helloEntry = await reopenDict.query('hello');
        assert.equal(helloEntry, "hello\nhello");
        let testEntry = await reopenDict.query('test');
        assert.equal(testEntry, "test\ntest");
    });

    test('persistent single entry', async () => {
        let dict = new NeDBDictionary(globalDbPath);
        let bigEntries: Entry[] = [];
        for (let i = 0; i < 100_000; ++i) {
            bigEntries.push({
                id: i,
                text: `${i}-${getNonce()}`
            });
        }
        for (let entry of bigEntries) {
            await dict.save(entry).then((result) => {
                //console.log(`${result?.id}`);
            });
        }
        let ok = await dict.close();
        assert.ok(ok);
    })
        .timeout(TEN_SECONDS * 8)
        ;

    test('format result', async () => {
        let dummyData: Entry[] = [
            {
                id: 1, 
                text: [
                    'Im Winter Einfrieren des Wassers im Behälter verhüten. (Sicherheitshinweis)',
                    'In winter prevent the water in the container from freezing. (safety note)'
                  ].join(' :: ')
            },
            {
                id: 2, 
                text: [
                    'Winter {m}',
                    'Winter {pl}',
                    'im Winter; wintertags [Lux.] [adm.]',
                    'ein strenger Winter',
                    'über den Winter kommen :: winter',
                    'winters',
                    'in (the) winter',
                    'a rough winter',
                    'to get through the winter'
                ].join(' | ')
            },
            {
                id: 3,
                text: 'Winter {m}; Winterzeit {f} :: wintertime; wintertide'
            }
        ];
        let dict = new NeDBDictionary(globalDbPath);
        dict.entitiesMap = dingLineParser;
        await dict.saveAll(dummyData);
        let result = await dict.query('Winter');
        //console.log(result);
    });

    test.only('big query', async () => {
        const dummyFile = '/home/hbui/.config/Code/User/globalStorage/hpb-htw.dxtionary/ding-de-en-dev.txt.db';
        let dict = new NeDBDictionary(dummyFile);
        dict.entitiesMap = dingLineParser;
        let result = await dict.query('Winter');
        console.log(result);
    }).timeout(TEN_SECONDS*4);
});