import * as assert from "assert";
import * as path from "path";

import {parseDingDictionary, importDict, constructDbPath} from "../dictparser";
import {Entry, NeDBDictionary} from "../dictionary";
import * as fs from "fs";


const bigDumpXML =   "../../big-file/dewiktionary-20191020-pages-articles.xml";
const smallDumpXML = "../../big-file/small-dewiktionary-20191020-pages-articles.xml";
const nsZeroPageCountInSmallDumpXML = 6; 

const halloPageDict = {
    path: "../../big-file/hallo-page.xml",
    lineOfPage: 56,
    firstLine: '{{Siehe auch|[[hallo]], [[halló]]}}',
    lastLine: '{{Ähnlichkeiten 1|[[Hall]], [[Halle]], [[halle]], [[Halo]], [[holla]], [[Holle]]}}'
};

const dingDeEnDict = {
    path: "../../big-file/small-ding-de-en.txt",
    firstLine: "A {n}; Ais {n}; As {n}; Aisis {n}; Ases {n} [mus.] | A-Dur {n} :: A; A sharp; A flat; A double sharp; A double flat | A major",
    lastLine: "Zylofuramin {n} [biochem.] :: zylofuramine",
    line: 4
};

const bigDingEnDeDict = {
    path: "../../dict/ding-de-en.txt",
    targetDir: '/tmp/ding',
    entriesCount:197766
};

const TEN_SECONDS = 10*1000; // as "macro" to easy reading




suite('ding', () => {
    let dbFile:string;
    let dingFile: string;

    setup(() => {
        fs.mkdirSync(bigDingEnDeDict.targetDir, {recursive:true});
        dingFile = path.join(__dirname, bigDingEnDeDict.path);
        dbFile = constructDbPath(dingFile, bigDingEnDeDict.targetDir);
        try{
            fs.unlinkSync(dbFile);
        }catch(ex) {
            //nix
        }
    });


    test('parse ding file', async () => {
        let dingFile = path.join(__dirname, dingDeEnDict.path);
        let result:Entry[] = [];
        let asyncFn = async function (entry:Entry) {
            let p = new Promise( (resolve, reject) => {
                setTimeout(() => {
                    //console.log(entry);
                    result.push(entry);
                    resolve(entry);
                }, 200);
            });
            await p;
        };
        await parseDingDictionary(dingFile, asyncFn);        
        assert.equal(result.length, dingDeEnDict.line);
        assert.equal(result[0].text ,dingDeEnDict.firstLine);
        assert.equal(result[dingDeEnDict.line-1].text, dingDeEnDict.lastLine);
    });

    test('import ding file to databse', async ()=> {
        let dict = new NeDBDictionary(dbFile);
        let lineCount = await importDict(dingFile,parseDingDictionary,dict);
        assert.equal(lineCount,bigDingEnDeDict.entriesCount);
    })
    .timeout(TEN_SECONDS*6)
    ;

});

