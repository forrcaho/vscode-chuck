import { Hover, Position, ProviderResult, TextDocument } from "vscode";
import ckdocJSON from "./ckdoc.json";

// Documentation Type for ckdoc
interface DocType {
    title: string;
    description: string;
    constructors: string[];
    functions: string[];
    examples: string[];
    link: string;
}
const ckdoc: { [key: string]: DocType } = ckdocJSON;

export default class ChuckHoverProvider {
    public provideHover(document: TextDocument, position: Position): ProviderResult<Hover> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return;
        }
        const word = document.getText(wordRange);

        // If we have a hover for that word
        // if (chuck_modules.includes(token)) {
            if (ckdoc[word]) {
                const wordDoc: DocType = ckdoc[word];
                return new Hover([wordDoc.title,wordDoc.description,
                    wordDoc.constructors.join("\n\n"),wordDoc.functions.join("\n\n"),
                    wordDoc.examples.join("\n\n"),wordDoc.link]);
            }
    
            // If we don't have a hover
            return;
    }
}
