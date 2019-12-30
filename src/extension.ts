import * as vscode from 'vscode';

const LOOKUP_CMD = "dxtionary.lookup";
const LOOKUP_CMD_UI = "dxtionary.lookup.ui";

let dictionaryPanel: vscode.WebviewPanel | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {

	console.log({"globalStoragePath":context.globalStoragePath});

	// every lookup can use this command to perform lookup.
	const lookupHandler = async (word: string) => {		
		let entry = await lookup(word, context);
		showEntry(word, entry, context);
	};
	context.subscriptions.push(vscode.commands.registerCommand(LOOKUP_CMD, lookupHandler));


	// User can trigger dictionary lookup
	const lookupUIHandler = async () => {
		let word = await vscode.window.showInputBox({ placeHolder: 'type your looking word' });
		const args = [word];
		vscode.commands.executeCommand(LOOKUP_CMD, args)
		.then( done => {
			console.log(`success lookup ${done}`);
		});
	};
	context.subscriptions.push(vscode.commands.registerCommand(LOOKUP_CMD_UI, lookupUIHandler));

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
	const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : vscode.ViewColumn.Beside;
	if (dictionaryPanel){		
		dictionaryPanel.reveal(columnToShowIn);
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
				dictionaryPanel = undefined;
			},
			null,
			context.subscriptions
		);
	}
	dictionaryPanel.title = word;
	dictionaryPanel.webview.html = render(word, entry);
}

function render(word: string, lookupResult: any) {
	return `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title${word}</title>
	</head>
	<body>
		<h1>${word}</h1>
		<div>${JSON.stringify(lookupResult)}</div>
	</body>
	</html>	
	`;
}
