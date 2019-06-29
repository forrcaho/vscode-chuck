import * as vscode from 'vscode';

import ChuckSyntaxCheckProvider from './features/chuckSyntaxCheckProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('activate called');
    let config = vscode.workspace.getConfiguration("chuck");
     let syntaxCheckEnabled = config.get("enableSyntaxCheck", false);
    if (syntaxCheckEnabled) {
        console.log("Syntax check enabled: loading provider");
        let syntaxChecker = new ChuckSyntaxCheckProvider();
        syntaxChecker.activate(context.subscriptions);
    } else {
        console.log("Syntax check not enabled.");
    }
}

// this method is called when your extension is deactivated
export function deactivate() {}
