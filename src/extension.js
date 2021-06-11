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
const getFilemapPath = fname => path.join(path.dirname(fname), '/.ci-charset-exclude')
const readFileSync = fname => fs.readFileSync(fname).toString().split("\n");
const alreadyOpenedFiles = new Map()

let ciCharsetExcludeFiles = []

async function detectCharset() {
    if (process.platform !== 'linux') return // use linux, pls

    let editor = vscode.window.activeTextEditor
    if (!editor) return // What?
    
    let filename = editor.document.fileName
    if (alreadyOpenedFiles.has(filename)) return
    alreadyOpenedFiles.set(filename, true) // save the file as cached
    
    
    const filemapPath = getFilemapPath(filename)
    if(fs.existsSync(filemapPath))
      ciCharsetExcludeFiles = readFileSync(filemapPath)

    let settingsFile = `${homedir}/.config/Code/User/settings.json`

    const checkCharsteCommand = `file -bi ${filename} | awk '{print toupper($0)}' | cut -d'=' -f2`
    exec(checkCharsteCommand, (err, stdout, stderr) => {
      let charset = (stdout.trim().includes('ISO')) ? 'iso88591' : 'utf8'
      if (stdout.trim().includes("ASCII")) {
        charset = 'utf8' // default for ascii is utf8
        if (ciCharsetExcludeFiles.length > 0) {
          charset = (!ciCharsetExcludeFiles.includes(filename)) ? 'iso88591' : 'utf8'
          console.log('using from charset based on ci-charset-excluded for ascii file', ciCharsetExcludeFiles)
      }
      }
      console.log('Changing to ', charset)
      let columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

      loadJsonFile(settingsFile).then((config) => {
        // if okay, nothing else to do
        if (config['files.encoding'] == charset) return

        // update the settings file
        updateJsonFile(settingsFile, config => {
          config['files.encoding'] = charset;
          delete config["files.autoGuessEncoding"];
          return config
        })

        // reopen the file with the correct charset.
        setTimeout(() => {
          vscode.window.showInformationMessage(`Reopening in corect charset ${charset}`)
          setTimeout(() => alreadyOpenedFiles.delete(filename), 3000) // just in case
          vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
              vscode.workspace.openTextDocument(filename).then((doc) => {
                  vscode.window.showTextDocument(doc, columnToShowIn, false);
              });
          });
        }, 1000);
      })
    });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
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
