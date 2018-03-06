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

module.exports = {
  pathExistsWarning,
  failedToCreateFileWarning,
  failedToCreateFolderWarning,
  noActiveFileWarning,
  noSelectionWarning,
  selectionSuccess,
  noTestFromSelectionWarning,
  templateGenSuccess,
  templateGenFailed
};
