Distribution package for self contained desktop R applications
==============================================================

Usage Notes
-----------

The distribution of self-contained desktop R applications requires:

* A distributable R interpreter (R-Portable)
* An application launch framework

Distributable R interpreter
---------------------------
`/R-Portable`:
  A "vanilla" installation of R that has been made "portable" by contributors to
  the Portable Apps project.  This effectively creates an isolated installation
  of R that can be used along side a system installation.

  It is important to keep R-portable as "clean" as possible.  This will make it
  easy to upgrade without worrying (too much) about upgrading or reinstalling
  package dependencies used by applications.


Application launch framework
----------------------------
`/script`:
  A directory of scripts that enable launching of R-based applications

`/script/wsf`:
  A directory of Windows Script Files and their dependencies for launching applications.

`/script/wsf/run.wsf`:
  The primary launching script. This file ensures that all dependencies are
  available in the calling environment, but does not have any scripting code.

  Windows Scripting Host is used because of its broader flexibility with interacting
  with the OS over simple batch (`*.bat`) files.

`/script/wsf/js`:
  Javascript dependencies used by `run.wsf`

`/script/wsf/js/run.js`:
  The javascript file that performs application launch

`/script/wsf/js/json2.js`:
  A 3rd party javascript library that enables JSON parsing with Windows Scripting Host.

  Unlike javascript engines provided by web browsers, the engine/interpreter exposed by
  Windows Scripting Host does not provide a native JSON object for handling parsing
  of JSON formatted files/config strings.

`/script/wsf/js/JSON.minify.js`:
  A 3rd party javascript library that strips C/C++ style comments from JSON files.
  Allows json config files to be annotated, and still be parsed without errors.

`/script/R`:
  R scripts for initializing the R environment during application launch

`/script/R/run.R`:
  The primary script for initializing the R environment and executing application launch via R.
  Will source(`<project root>/app/app.R`) to launch the application.

  This file needs to exist and have appropriate application launch commands (e.g. `shiny::runApp(...)``)
