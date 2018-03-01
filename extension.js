// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const { generateTestTemplate, generateTest } = require("js-test-gen");
const clipboardy = require("clipboardy");
const fs = require("fs");

/**
 * User messages
 */

// fs related messages
const pathExistsWarning = "Test already exists, cannot overwrite existing test";
const failedToCreateFileWarning = "Failed to write test template to disk";
const failedToCreateFolderWarning = "Failed to write folder to disk";

// common warning's
const noActiveFileWarning = "No active file open to generate test";

// selection related messages
const noSelectionWarning = "No text selected ";
const selectionSuccess = "Test copied to clipboard";
const noTestFromSelectionWarning = "Could not create test from selection";

// Template generation related messages
const templateGenSuccess = "Test Template Generated";
const templateGenFailed = "Could not create test template from this file";

/**
 * File related utils
 */
// path up to just before fileName
const getFilePath = (path = "") => path.slice(0, path.lastIndexOf("/"));
// fileName without extension
const getFileName = (path = "") =>
  path
    .slice(path.lastIndexOf("/") + 1, path.length)
    .replace(/\.(js|ts|jsx|tsx)$/, "");

// no dirName specified ? import code from "./" : else "../"
const determinePath = (dirName = "", fileName = "") =>
  dirName ? `../${fileName}` : `./${fileName}`;

// No dirName specified ? write to current dir : write to specified dir
const determineSaveLoc = (dirName = "", filePath = "", fileName = "") =>
  dirName
    ? `${filePath}/${dirName}/${fileName}` // save to user specified loc
    : `${filePath}/${fileName}`; // save to current dir

const areExistingTestFile = path => (fs.existsSync(path) ? true : false);

const ensureDirectoryExistence = filePath => {
  if (fs.existsSync(filePath)) {
    return true;
  }
  try {
    fs.mkdirSync(filePath);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const writeTemplate = (saveLocation, template) => {
  return fs.writeFile(saveLocation, template, err => {
    if (err) {
      console.error(err);
      return vscode.window.showWarningMessage(failedToCreateFileWarning);
    }
    return vscode.window.showInformationMessage(templateGenSuccess);
  });
};

/**
 * User setting
 */

const determineTypeSystem = (typeSystem = "") => {
  if (typeSystem === "None") {
    return "";
  }
  return typeSystem.toUpperCase();
};

function activate(context) {
  let testFromFile = vscode.commands.registerCommand(
    "extension.generateTestTemplate",
    generateTestFileTemplate
  );

  let testFromSelection = vscode.commands.registerCommand(
    "extension.generateTest",
    generateTestFromSelection
  );

  context.subscriptions.push(testFromFile);
  context.subscriptions.push(testFromSelection);
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;

const generateTestFileTemplate = () => {
  let editor = vscode.window.activeTextEditor;
  if (editor) {
    let doc = editor.document;
    // user settings
    const {
      testDirName,
      testSufix,
      typeSystem
    } = vscode.workspace.getConfiguration("jstestgen");
    // file info: Name, path
    const srcFileName = getFileName(doc.fileName);
    const filePath = getFilePath(doc.fileName);
    // generated test info: testFileName, saveLocation for test
    const testFileName = `${srcFileName}${testSufix}.js`; // Add the suffix
    const saveLocation = determineSaveLoc(testDirName, filePath, testFileName);

    // Do not overwrite users current test files !!!!
    if (areExistingTestFile(saveLocation)) {
      return vscode.window.showErrorMessage(pathExistsWarning);
    } else {
      // This is the test template
      const template = generateTestTemplate({
        contents: doc.getText(),
        srcFileName,
        importFromPath: determinePath(testDirName, srcFileName), // important for import
        typeSystem: determineTypeSystem(typeSystem)
      });
      // possibility template could be an empty string
      if (!template) {
        return vscode.window.showErrorMessage(templateGenFailed);
      }
      // check and write to user defined folder if it exists
      if (testDirName) {
        // check if able to write to disk
        if (!ensureDirectoryExistence(`${filePath}/${testDirName}`)) {
          return vscode.window.showErrorMessage(failedToCreateFolderWarning);
        }
      }
      // Write the contents to the new test file.
      return writeTemplate(saveLocation, template);
    }
  } else {
    return vscode.window.showWarningMessage(noActiveFileWarning);
  }
};

const generateTestFromSelection = () => {
  let editor = vscode.window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    const text = editor.document.getText(selection);
    if (text) {
      const { typeSystem } = vscode.workspace.getConfiguration("jstestgen");
      const template = generateTest(text, determineTypeSystem(typeSystem));

      // Check if their is actually a template, it could be an empty string
      if (template) {
        clipboardy.writeSync(template);
        return vscode.window.showInformationMessage(selectionSuccess);
      }
      return vscode.window.showWarningMessage(noTestFromSelectionWarning);
    } else {
      return vscode.window.showWarningMessage(noSelectionWarning);
    }
  }
  return vscode.window.showWarningMessage(noActiveFileWarning);
};
