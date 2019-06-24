import * as vscode from 'vscode';

import ChuckSyntaxCheckProvider from './features/chuckSyntaxCheckProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('activate called');
    let syntaxChecker = new ChuckSyntaxCheckProvider();
    syntaxChecker.activate(context.subscriptions);
}

// this method is called when your extension is deactivated
export function deactivate() {}
