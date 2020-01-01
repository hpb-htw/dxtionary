import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Dictionary, NeDBDictionary, dingLineParser } from './dictionary';
import { constructDbPath, importDict, parseDingDictionary } from './dictparser';


const LOOKUP_CMD        = "dxtionary.lookup";
const LOOKUP_CMD_UI     = "dxtionary.lookup.ui";
const LOOKUP_CMD_CURSOR = "dxtionary.lookup.cursor";
const EXTRACT_BUILT_IN_DICT = "dxtionary.extract.builtin.dict";

const DICT_DIR = "dict";
const BUILTIN_DICTS = {
	"ding": "ding-de-en-dev.txt"
};

let dictionaryPanel: vscode.WebviewPanel | undefined = undefined;
let dictionary : Dictionary|undefined;
let dbFile: string;

const normalizedArg = (word:string|undefined) => word && word.trim().length > 0 ? [word] : []; 

export function activate(context: vscode.ExtensionContext) {

	let {globalStoragePath,storagePath,extensionPath} = context;
	console.log({globalStoragePath, extensionPath, storagePath:String(storagePath)});
	// check if ding dictionary exists?
	let dingDictPath = path.join(extensionPath, `${DICT_DIR}/${BUILTIN_DICTS.ding}`);
	dbFile = constructDbPath(dingDictPath, globalStoragePath);
	if (! fs.existsSync(dbFile)) {
		showMsgWhenDictNotExist();
	} else {
		dictionary = createDictionary();
	}

	// every lookup can use this command to perform lookup.
	const lookupHandler = async (word: string) => {		
		if(word && word.length > 0) {
			let entry = await lookup(word, context);			
			showEntry(word, entry, context);
		}else {
			vscode.window.showInformationMessage("Nothing to lookup");
		}
	};
	context.subscriptions.push(vscode.commands.registerCommand(LOOKUP_CMD, lookupHandler));


	// User can trigger dictionary lookup
	const lookupUIHandler = async () => {
		let word = await vscode.window.showInputBox({ placeHolder: 'type your looking word' });
		const args = normalizedArg(word);
		vscode.commands.executeCommand(LOOKUP_CMD, args)
			.then(done => {
				console.log(`success lookup ${done}`);
			});
	};
	context.subscriptions.push(vscode.commands.registerCommand(LOOKUP_CMD_UI, lookupUIHandler));

	// User can trigger lookup word under cursor
	const lookupCursorHandler = async () => {
		let word = determinateWordUnderCurser();
		const args = normalizedArg(word);
		vscode.commands.executeCommand(LOOKUP_CMD, args)
			.then(done => {
				console.log(`lookup ${word} done with result ${done}`);
			});
	};
	context.subscriptions.push(vscode.commands.registerCommand(LOOKUP_CMD_CURSOR, lookupCursorHandler));

	// Auxiliary commands
	const extractBuiltinDicts = async() => {		
		//console.log(`use dictionary ${dbFile}`);
		let extractMsg = `Please be patient, dxtionary will inform you when extracting is done.
		Extract dictionary to database file ${dbFile}.`;
		vscode.window.showInformationMessage(extractMsg);
		_extractBuiltinDicts(dingDictPath, dbFile);
	};
	context.subscriptions.push(vscode.commands.registerCommand(EXTRACT_BUILT_IN_DICT, extractBuiltinDicts));
}

// this method is called when your extension is deactivated
export function deactivate() {
	if(dictionary) {
		dictionary.close()
			.then(()=> {
				console.log("Done");
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
				console.log(`User close dictionary view`);
				dictionaryPanel = undefined;// assign it to undefined to unmantaine it
			},
			null,
			context.subscriptions
		);
	}	
	dictionaryPanel.title = word;
	let html = render(word, entry);
	console.log(html);
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
        table {
            font-family: sans-serif;
        }

        tr {
            vertical-align: top;
        }

        table tr:nth-child(odd) td {
            background-color: lightskyblue;
        }

        table tr:nth-child(even) td {
            background-color: lightgrey;
        }
    </style>
	</head>
	<body>
		<h1>Lookup: ${word}</h1>
		<div>${lookupResult}</div>
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

function _extractBuiltinDicts(dingDictPath:string, dbFile:string){
	try {
		fs.unlinkSync(dbFile);
	}catch(ex) {
		// ignore it
	}
	let dict = new NeDBDictionary(dbFile);
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
	let dict = new NeDBDictionary(dbFile);
	dict.entitiesMap = dingLineParser;
	return dict;
}