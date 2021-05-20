// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { exec, execSync } = require("child_process");
const path = require('path')
const fs = require('fs')
const homedir = require('os').homedir();
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
const loadJsonFile = require('load-json-file');
const updateJsonFile = require('update-json-file');

let myStatusBarItem


async function detectCharset() {
    console.log(Date())

    let editor = vscode.window.activeTextEditor
    if (!editor) return
    let filename = editor.document.fileName
    // @TODO: Ignore based on .ci-charset-exclude
    let filemap = null
    let filemapPath = path.join(path.dirname(filename), '/.charset-auto-select.json')
    console.log('path ', filemapPath)
    if(fs.existsSync(filemapPath)) {
      filemap = require(path.dirname(filename) + '/.charset-auto-select.json')
      console.log('loading filemap from workspace', filemap)
    }
    console.log('home', homedir)
    let settingsFile = `${homedir}/.config/Code/User/settings.json`
    console.log('settings file', settingsFile)

    exec(`file -bi ${filename} | awk '{print toupper($0)}' | cut -d'=' -f2`, (err, stdout, stderr) => {
      let charset = (stdout.trim().includes('ISO')) ? 'iso88591' : 'utf8'
      console.log("CHARSETTTTTTTTTTT", charset)
      if (stdout.trim().includes("ASCII")) {
        if (!filemap || !filemap.ASCII) {
          vscode.window.showInformationMessage(`Detected ASCII encoding, verify manually`)
          console.log('no custom filemap for ascii')
          return
        }
        charset = filemap.ASCII
        console.log('using from filemap', filemap)
      }
      console.log('Changing to ', charset)
    //   vscode.window.showInformationMessage(`Detected stdout: ${stdout}`)
      // vscode.window.showInformationMessage(`stdout: ${stdout}`);
      let columnToShowIn = vscode.window.activeTextEditor
                  ? vscode.window.activeTextEditor.viewColumn
                  : undefined;

      loadJsonFile(settingsFile).then((config) => {
        if (config['files.encoding'] == charset) return

        updateJsonFile(settingsFile, config => {
          config['files.encoding'] = charset;
          delete config["files.autoGuessEncoding"];
          return config
        })

        setTimeout(() => {
          vscode.window.showInformationMessage(`Reopening in corect charset ${charset}`)
          vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
              vscode.workspace.openTextDocument(filename).then((doc) => {
                  vscode.window.showTextDocument(doc, columnToShowIn, false);
              });
          });
          
        //   updateJsonFile(settingsFile, config => {
        //     config['files.encoding'] = 'utf8';
        //     return config
        //   })
        }, 1000);
      })
    });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "charset-auto-select" is now active!');
    
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	// let disposable = vscode.commands.registerCommand(
    // 'charset-auto-select.detectCharset',
    // detectCharset);

    // let disposable = vscode.languages.registerCodeActionsProvider({ scheme: 'file', language: 'PHP' }, detectCharset)
    let disposable = vscode.window.onDidChangeActiveTextEditor(e => detectCharset())
	// context.subscriptions.push(disposable);
     detectCharset()
}

// this method is called when your extension is deactivated
function deactivate() {return undefined}

module.exports = {
	activate,
	deactivate,
    detectCharset
}
