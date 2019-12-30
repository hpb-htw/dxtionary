import * as assert from "assert";
import * as path from "path";

import {parseWikiDump, parseDingDictionary, importDingDict} from "../dictparser";
import {Entry} from "../dictionary";


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
    path: "../../big-file/ding-de-en.txt",
    targetDir: '/tmp/ding'
};

const TEN_SECONDS = 10*1000; // as "macro" to easy reading

suite('wikipedia', () => {
    test('parse xml dump', async () => {
        let xmlPath = path.join(__dirname, smallDumpXML);
        let result: any[] = [];
        await parseWikiDump(xmlPath,  (entry) => {
            result.push(entry);
        });
        let entriesCount = result.length;
        assert.equal(entriesCount, nsZeroPageCountInSmallDumpXML);
    });


    test ('parse page correct', async () => {
        let xmlPath = path.join(__dirname, halloPageDict.path);
        let result: Entry[] = [];
        await parseWikiDump(xmlPath,  (entry) => {
            result.push(entry);
        });
        //console.log(result);
        let hallo = result.filter((page)=> page.id===555);
        assert.equal(hallo.length, 1, "there is only one page with tile Hallo");
        let text = hallo[0].text.split("\n");
        assert.equal(text.length, halloPageDict.lineOfPage);
        assert.equal(text[0], halloPageDict.firstLine);
        assert.equal(text[halloPageDict.lineOfPage-1], halloPageDict.lastLine);
    });
});


suite('ding', () =>{
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

    test.skip('import ding file to databse', async ()=> {
        let dingFile = path.join(__dirname, bigDingEnDeDict.path);
        let targetDir = bigDingEnDeDict.targetDir;
        let result = await importDingDict(dingFile, targetDir);
        console.log(result);
    })
    //.timeout(TEN_SECONDS*20)
    ;

});

