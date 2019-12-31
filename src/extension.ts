import * as vscode from 'vscode';
import * as path from 'path';
import { Dictionary } from './dictionary';
import { constructDbPath } from './dictparser';

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

const normalizedArg = (word:string|undefined) => word && word.trim().length > 0 ? [word] : []; 

export function activate(context: vscode.ExtensionContext) {

	let {globalStoragePath,storagePath,extensionPath} = context;
	console.log({globalStoragePath, extensionPath, storagePath:String(storagePath)});
	
	

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
			.then(done => console.log(`lookup ${word} done with result ${done}`));
	};
	context.subscriptions.push(vscode.commands.registerCommand(LOOKUP_CMD_CURSOR, lookupCursorHandler));

	// Auxiliary commands
	const extractBuiltinDicts = async() => {
		let dingDictPath = path.join(extensionPath, `${DICT_DIR}/${BUILTIN_DICTS.ding}`);
		let dbFile = constructDbPath(dingDictPath, globalStoragePath);
		//console.log(`use dictionary ${dbFile}`);
		let extractMsg = `extract dictionary to database file ${dbFile}.
		Please be patient, dxtionary will inform you when extracting is done.`;
		vscode.window.showInformationMessage(extractMsg);
	};
	context.subscriptions.push(vscode.commands.registerCommand(EXTRACT_BUILT_IN_DICT, extractBuiltinDicts));

}

// this method is called when your extension is deactivated
export function deactivate() { }

async function lookup(word: string, context: vscode.ExtensionContext) {
	return {
		"word": word,
		"dictionary": "dictionary id goes here",
		"entry": "Entry of the word in the dictionary"
	};
}

function showEntry(word: string, entry: any, context: vscode.ExtensionContext) {
	
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
	dictionaryPanel.webview.html = render(word, entry);
}

function render(word: string, lookupResult: any) {
	console.log(word);
	return `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title${word}</title>
	</head>
	<body>
		<h1>Lookup: ${word}</h1>
		<div>${JSON.stringify(lookupResult)}</div>
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