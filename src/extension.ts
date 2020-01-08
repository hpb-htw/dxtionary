import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Dictionary } from './dictionary';
import { constructDbPath, importDict} from './dictImporter';
import { parseDingDictionary, dingLineParser, DingDictionary } from './dingstructure';



const LOOKUP_CMD        = "dxtionary.lookup";
const LOOKUP_CMD_UI     = "dxtionary.lookup.ui";
const LOOKUP_CMD_CURSOR = "dxtionary.lookup.cursor";
const EXTRACT_BUILT_IN_DICT = "dxtionary.extract.builtin.dict";

const DICT_DIR = "dict";
const BUILTIN_DICTS = {
	"ding": "ding-de-en-dev.txt",
	"de-wiki": "dewiktionary-20191020-pages-articles.db"
};

let dictionaryPanel: vscode.WebviewPanel | undefined = undefined;
let dictionary : Dictionary|undefined;
let dbFile: string;

const normalizedArg = (word:string|undefined) => word && word.trim().length > 0 ? [word] : [""]; 

const DingCSSStyle = "style/ding-dict.css";
let cssStyle:string|undefined = undefined;

const INIT_TEXT = "<span>::</span>";

export function activate(context: vscode.ExtensionContext) {

	let {globalStoragePath,storagePath,extensionPath} = context;
	console.log({globalStoragePath, extensionPath, storagePath:String(storagePath)});
	// check if dictionary file exists?
	//let dictPath = path.join(extensionPath, `${DICT_DIR}/${BUILTIN_DICTS.ding}`);
	let dictPath = path.join(extensionPath, `${DICT_DIR}/${BUILTIN_DICTS["ding"]}`);
	dbFile = constructDbPath(dictPath, globalStoragePath);
	console.log(dbFile);
	if (! fs.existsSync(dbFile)) {
		showMsgWhenDictNotExist();
	} else {
		dictionary = createDictionary();
	}

	// read css style
	try{
		let cssPath = path.join(extensionPath, DingCSSStyle);
		cssStyle = fs.readFileSync(cssPath, "utf8");
	}catch(ex) {
		console.log(ex); //log exception
	}

	showEntry("::", INIT_TEXT, context);

	// every lookup can use this command to perform lookup.
	const lookupHandler = async (word: string) => {
		if(word && word.length > 0) {
			try{
				let entry = await lookup(word, context);
				console.log(entry);
				showEntry(word, entry, context);
			}catch(ex) {
				console.log(ex);//log exception
				vscode.window.showInformationMessage(`something goes wrong as lookup ${word}`);
			}
		}else {
			vscode.window.showInformationMessage("Nothing to lookup");
		}
	};
	context.subscriptions.push(vscode.commands.registerCommand(LOOKUP_CMD, lookupHandler));


	// User can trigger dictionary lookup
	const lookupUIHandler = async () => {
		let word = await vscode.window.showInputBox({ placeHolder: 'type your looking word' });
		const args = normalizedArg(word);
		vscode.commands.executeCommand(LOOKUP_CMD, ...args)
			.then(done => {
				console.log(`success lookup ${done}`);
			});
	};
	context.subscriptions.push(vscode.commands.registerCommand(LOOKUP_CMD_UI, lookupUIHandler));

	// User can trigger lookup word under cursor
	const lookupCursorHandler = async () => {
		let word = determinateWordUnderCurser();
		const args = normalizedArg(word);
		vscode.commands.executeCommand(LOOKUP_CMD, ...args)
			.then(done => {
				console.log(`lookup ${word} done`);
			});
	};
	context.subscriptions.push(vscode.commands.registerCommand(LOOKUP_CMD_CURSOR, lookupCursorHandler));

	// Auxiliary commands
	const extractBuiltinDicts = async() => {
		let extractMsg = `Please be patient, dxtionary will inform you when extracting is done.
		Extract dictionary to database file ${dbFile}.`;
		vscode.window.showInformationMessage(extractMsg);
		_extractBuiltinDicts(dictPath, dbFile);
	};
	context.subscriptions.push(vscode.commands.registerCommand(EXTRACT_BUILT_IN_DICT, extractBuiltinDicts));
}

// this method is called when your extension is deactivated
export function deactivate() {
	if(dictionary) {
		dictionary.close()
			.then(()=> {
				console.log("Deactivate extension ok");
			})
			.catch((ex)=> {
				console.log(ex); 
			});
	}
}

async function lookup(word: string, context: vscode.ExtensionContext): Promise<string> {
	if(!dictionary) {
		dictionary = createDictionary();
	}	
	return dictionary.query(word);
}

function showEntry(word: string, entry: string, context: vscode.ExtensionContext) {	
	if (dictionaryPanel) {
		dictionaryPanel.reveal(vscode.ViewColumn.Beside, true);
	} else {
		dictionaryPanel = vscode.window.createWebviewPanel(
			LOOKUP_CMD,
			word,
			vscode.ViewColumn.Beside,
			{}
		);

		dictionaryPanel.onDidDispose(
			() => {
				dictionaryPanel = undefined;// assign it to undefined to unmantaine it
			},
			null,
			context.subscriptions
		);
	}	
	dictionaryPanel.title = "Suche " + word;
	let html = render(word, entry);	
	dictionaryPanel.webview.html = html;
}

function render(word: string, lookupResult: string):string {	
	return `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>${word}</title>
		<style>
        ${cssStyle}
    	</style>
	</head>
	<body>
		<h1>Suche nach: ${word}</h1>
		<div>
		${lookupResult}
		
		</div>
	</body>
	</html>	
	`;
}

function determinateWordUnderCurser(): string|undefined {
	const { activeTextEditor } = vscode.window;

	// If there's no activeTextEditor, do nothing.
	if (!activeTextEditor) {
		return undefined;
	}

	const { document, selection } = activeTextEditor;
	const { end, start } = selection;

	// text too long, so do nothing
	if (!selection.isSingleLine) {
		return undefined;
	}

	let cursorPosition = start;
	let wordRange = document.getWordRangeAtPosition(cursorPosition);
	if(wordRange) {
		let highlight = document.getText(wordRange);
		return highlight;
	}else {
		return undefined;
	}
}

/*this mechanism only work for NeDB not for wiki*/
function _extractBuiltinDicts(dingDictPath:string, dbFile:string){
	try {
		fs.unlinkSync(dbFile);
	}catch(ex) {
		// ignore it
	}
	let dict = new DingDictionary(dbFile);
	return importDict(dingDictPath, parseDingDictionary, dict)
		.then( (line)=> {
			let msg = `Extract ${line} entry finished`;
			vscode.window.showInformationMessage(msg);
		})
		.catch( (ex)=> {
			console.log(ex);
			vscode.window.showErrorMessage(String(ex));
		})
		.finally(() => {
			dict.close();
		});
}

function showMsgWhenDictNotExist() {
	let msg = `Dictionary file does not exist. Run cmd below to extract dictionary from extension!`;
	//let secondMsg = `command:${EXTRACT_BUILT_IN_DICT}`;
	const cmd = `command:${EXTRACT_BUILT_IN_DICT}`;
	//const commentCommandUri = vscode.Uri.parse(cmd);
	//const contents = new vscode.MarkdownString(`[Extract  Dictionary](${commentCommandUri})`);
	//contents.isTrusted = true;
	vscode.window.showInformationMessage(msg, cmd)
		.then(()=> {
			vscode.commands.executeCommand(EXTRACT_BUILT_IN_DICT);
		});
}

function createDictionary():Dictionary {
	let dict = new DingDictionary(dbFile);
	dict.entitiesMap = dingLineParser;
	return dict;
}