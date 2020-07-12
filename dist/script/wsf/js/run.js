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

var sBaseDir = oFSO.GetAbsolutePathName('.');
var fConfig = oFSO.OpenTextFile('app\\config.cfg', 1); // 1 = for reading
var sConfig = (fConfig.AtEndOfStream) ? "" : fConfig.ReadAll();

fConfig.Close()

if (this.JSON) {
	var oConfig = (sConfig !== "") ? JSON.parse(JSON.minify(sConfig)) : undefined;
} else {
	oShell.Popup('Error: JSON object not found, cannot process configuration');
	WScript.Quit(1);
}

var oDEFAULTS = {
	"packages": {
		"cran": "http://cran.rstudio.com"
	},

	"r_exec": {
		"home": "dist\\R-Portable\\App\\R-Portable\\bin",

		//' Rscript.exe is much more efficient than R.exe CMD BATCH
		"command": "Rscript.exe",

		//' --vanilla implies the following flags:
		//' --no-save --no-environ --no-site-file --no-restore --no-Rconsole --no-init-file
		"options": "--vanilla"
	},

	"logging": {
		"use_userprofile": false,
		"filename": "error.log"
	}
}

// Unfortunately, "modern" ECMAscript is not supported by wscript, so
// conveniences like:
// var oCONFIG = Object.assign(oConfig, oDEFAULTS);
// are not supported

// Determine where to keep the error log
// If deployed to users individually, keep with the deployment (default)
// If deployed to a central location (e.g. a network share) use a directory in
// each user's %userprofile%
//' Determine User Home directory
var sUPath = oShell.ExpandEnvironmentStrings("%USERPROFILE%");
var sAppUPath = sUPath + "\\." + oConfig.appname;
var sLogPath = 'log';
if (oConfig.logging.use_userprofile) {
	var sLogPath = sAppUPath;
}

//' Create an application log directory as needed
if (!oFSO.FolderExists(sLogPath)) {
	oFSO.CreateFolder(sLogPath);
}

var sLogFile = oConfig.logging.filename ? oConfig.logging.filename : oDEFAULTS.logging.filename;

//' Define the R interpreter
var Rhome = oConfig.r_exec.home ? oConfig.r_exec.home : oDEFAULTS.r_exec.home;
var Rcmd  = oConfig.r_exec.command ? oConfig.r_exec.command : oDEFAULTS.r_exec.command;
var Ropts = oConfig.r_exec.options ? oConfig.r_exec.options : oDEFAULTS.r_exec.options;

Rexe = Rhome + "\\" + Rcmd;

if (!oFSO.FileExists(Rexe)) {
	oShell.Popup('Error: R executable not found:\n' + Rexe);
	WScript.Quit(1);
}

function enquote(s) { return "\"" + s + "\""; }

var RScriptFile    = sBaseDir + "\\dist\\script\\R\\run.R";
var Outfile        = sLogPath + "\\" + sLogFile;

var strCommand     = [enquote(Rexe), Ropts, enquote(RScriptFile), ">", enquote(Outfile), "2>&1"].join(" ");
var intWindowStyle = 0;

// Either .Run or Rscript inappropriately captures the redirection to the log file as a parameter
// As a workaround create a temporary .bat file to invoke strCommand as needed
var batFilePath = enquote(sAppUPath + '\\run.bat');
var batFile = oFSO.CreateTextFile(sAppUPath + '\\run.bat', 2); // 2 = for writing
batFile.WriteLine("cd " + enquote(sBaseDir));
batFile.WriteLine(strCommand);
batFile.Close();

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

oShell.Run(batFilePath, intWindowStyle, bWaitOnReturn);
