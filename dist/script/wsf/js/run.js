// JSON object provided by json2.js since WSH JScript interpreter doesn't have/expose it
// https://github.com/douglascrockford/JSON-js/blob/master/json2.js
//
// JSON.minify provided by https://github.com/getify/JSON.minify
// to strip out comments from JSON so that it can be parsed without error.
//
// This script and dependencies are is loaded into the interpreter using a .wsf file:
// http://stackoverflow.com/questions/14319592/jscript-dynamically-load-javascript-libraries

//' Instantiate required objects
var oFSO = WScript.CreateObject("Scripting.FileSystemObject");
var oShell = WScript.CreateObject("WScript.Shell");

var fConfig = oFSO.OpenTextFile('app\\config.cfg', 1); // 1 = for reading
var sConfig = (fConfig.AtEndOfStream) ? "" : fConfig.ReadAll();

if (this.JSON) {
	var oConfig = (sConfig !== "") ? JSON.parse(JSON.minify(sConfig)) : undefined;
} else {
	oShell.Popup('Error: JSON object not found, cannot process configuration');
	WScript.Quit(1);
}

// Determine where to keep the error log
// If deployed to users individually, keep with the deployment (default)
// If deployed to a central location (e.g. a network share) use a directory in
// each user's %userprofile%
sLogPath = 'log';
if (oConfig.logging.use_userprofile) {
	//' Determine User Home directory
	var sUPath = oShell.ExpandEnvironmentStrings("%USERPROFILE%");
	var sLogPath = sUPath + "\\." + oConfig.appname;
}

//' Create an application log directory as needed
if (!oFSO.FolderExists(sLogPath)) {
	oFSO.CreateFolder(sLogPath);
}

sLogFile = 'error.log';
if (oConfig.logging.filename) {
	sLogFile = oConfig.logging.filename;
}

//' Define the R interpreter
var Rbindir        = "dist\\R-Portable\\App\\R-Portable\\bin";
if (oConfig.r_bindir) {
	var Rbindir = oConfig.r_bindir;
}

//' Rscript.exe is much more efficient than R.exe CMD BATCH
var Rexe           = Rbindir + "\\Rscript.exe";
var Ropts          = "--vanilla";

//' --vanilla implies the following flags:
//' --no-save --no-environ --no-site-file --no-restore --no-Rconsole --no-init-file

if (!oFSO.FileExists(Rexe)) {
	oShell.Popup('Error: R executable not found:\n' + Rexe);
	WScript.Quit(1);
}

var RScriptFile    = "dist\\script\\R\\run.R";
var Outfile        = sLogPath + "\\" + sLogFile;

var strCommand     = [Rexe, Ropts, RScriptFile, "1>", Outfile, "2>&1"].join(" ");
var intWindowStyle = 0;
/*
' other values:
' 0 Hide the window and activate another window.
' 1 Activate and display the window. (restore size and position) Specify this flag when displaying a window for the first time.
' 2 Activate & minimize.
' 3 Activate & maximize.
' 4 Restore. The active window remains active.
' 5 Activate & Restore.
' 6 Minimize & activate the next top-level window in the Z order.
' 7 Minimize. The active window remains active.
' 8 Display the window in its current state. The active window remains active.
' 9 Restore & Activate. Specify this flag when restoring a minimized window.
' 10 Sets the show-state based on the state of the program that started the application.
*/

//' continue running script after launching R
var bWaitOnReturn  = false;

oShell.Run(strCommand, intWindowStyle, bWaitOnReturn);
