# DesktopDeployR
A framework for deploying self-contained R-based applications to the desktop

## Overview
Allows developers to share R based applications to users as desktop applications
by providing both a portable R executable environment and a private application
package library.

For more information on how this framework was developed please read:

* http://oddhypothesis.blogspot.com/2014/04/deploying-self-contained-r-apps-to.html
* http://oddhypothesis.blogspot.com/2016/04/desktop-deployr.html

## Target Audience
Software Developers and Research Scientists who need to share applications in an
environment where installing system / OS level software can be challenging and
where use of other isolation and portability techniques (e.g. Docker containers)
is not feasible.

## Usage

### Develop an Application
This deployment strategy has been tested with R based applications developed
with Shiny, RGTK, and Tcl/Tk UIs.  The specifics of how to make applications
with each of these frameworks are beyond the scope of these instructions.

### Clone this repository
```bash
cd /path/to/deployment/staging
git clone https://github.com/wleepang/DesktopDeployR.git MyApplication
```

The `git clone` command above will clone the framework into a folder named
`MyApplication`.

Alternatively, you can fork this repository into your own Github account and
clone from there.

### Create a branch for your app
It is highly recommended that you create a branch for your application:
```bash
cd /path/to/MyApplication
git checkout -b MyApplication
```

This will allow you to easily track your application code and any customizations
you make to the framework.

### "Install" R-Portable into the framework
The framework can be used with both a system installed version of R or R-Portable.
The latter is recommended as it provides the most application isolation and allows
for applications to be deployed to users unable to install R on their own (i.e.
they lack sufficient system privileges).

Download R-portable from:
https://sourceforge.net/projects/rportable/

Install it into:
```
/<appname/dist/
```

### Customize the framework for your application

#### Install application scripts / assets
For example - a shiny app:

* create a folder called `app/shiny`
* put `ui.R`, `server.R`, and any other related files into `app/shiny`
* edit `app/app.R`:

	```r
	# assuming all shiny app code (ui.R and server.R are in ./app/shiny)
	shiny::runApp('./app/shiny')
	```

#### Specify package dependencies
Edit `app/packages.txt` - adding your app's primary package dependencies, one
package per line.

For a `shiny` app that depends on `ggplot`, `app/packages.txt` should look like:
```
jsonlite  # required by DesktopDeployR
shiny
ggplot
```

Packages listed here, along with their dependencies, are installed in a private
application library (`app/library`) when the application is run for the first
time.

Note, the above only works for packages available on CRAN. Custom packages need
to be installed manually.  The recommended method is to use `devtools`:
```
$ Rscript -e "devtools::install('path/to/package', lib = '<appname>/app/library')"
```

#### Configure application launch options
The file `app/config.cfg` is a JSON-ish formatted file that configures how the
application is launched.  Block (`/* ... */`) and line level (`// ...`) comments
are allowed - they are removed to create valid JSON before the file is parsed.

**Root level options:**

| Option     | Description |
| :---       | :--- |
| `appname`  | The name of the application.  Displayed in the title of the progress bar shown during initialization, and used to name folders for logs based on logging settings (see below). |
| `packages` | (Optional: Default: `"http://cran.rstudio.com"`) An object with a single element `cran` that specifies the CRAN mirror to use for installing packages.  Alternatively, this can point to a private CRAN-like package repository for more control over package versions. |
| `r_exec` | (Optional; Default: `"dist\\R-Portable\\App\\R-Portable\\bin\\"`) An object with elements specifying  R execution options (see below). |
| `logging`  | (Optional; Default: `undefined`) An object with elements specifying logging options (see below) |


**R Executable Options**

| Option            | Description |
| :---              | :--- |
| `home`        | (Optional; Default: `"dist\\R-Portable\\App\\R-Portable\\bin\\"`) Path to `<R_HOME>/bin` - the R environment to use to run the app.  |
| `command` | (Optional; Default: `Rscript.exe`) Name of the specific R interpreter executable to use.  |
| `options` | (Optional; Default: `--vanilla`) Options to pass to the R interpreter executable.  |


**Logging Options:**

| Option            | Description |
| :---              | :--- |
| `filename`        | (Optional; Default: `"error.log"`) Name of the application log file.  This file captures all text sent to `stdout` and `stderr` by the application.  |
| `use_userprofile` | (Optional; Default: `false`) Boolean flag to set where application logs are kept.  If `true` the application log file is written to `%USERPROFILE%/.<appname>/`.  |

#### Rename the application launching batch script file
Rename `appname.bat` as appropriate - e.g. to `MyApplication.bat`.


### Deploy your application
#### Option 1
The entire application folder is copied to the deployed location.  This is the
easiest way to deploy.  Note, it is possible to place / launch an application
from a network share.  If this is the case, be sure to set `logging.use_userprofile: true`
in the application launch configuration.

#### Option 2
Create an installer using NSIS installer or InnoSetup.  This is ideal for installing
on isolated workstations.  Both R-portable and package dependencies can be compiled
with the installer.  This means that a "first run" that ensures all package
dependencies, must occur before compiling an installer.

**TBD**: an example InnoSetup installer compile script


## Notes

### Using a Reset/Refresh button in your app
If you want to add a Reset/Refresh button that would allow the user to restart your app, one way to do this
could be as follows:

**Create the button by adding the following into your app_ui.R file:**

```r
shiny::actionButton("reset","Reset",  class = "btn-refresh")
```

**Show a dialog box to confirm (or to cancel) app refreshing when clicking on the "Reset" button by adding the following into your app_server.R file:**
```r
observeEvent(input$reset, {
    
      modal_confirm <- modalDialog(
        "Are you sure you want to reset the app\u003f",
        title = "Reset app",
        footer = tagList(
          actionButton("cancel", "Cancel"),
          actionButton("ok", "Reset", 
          class = "btn btn-danger", 
          style="color: #fff; background-color: red; border-color: red")
        )
      )
      
      showModal(modal_confirm)
  })
  
observeEvent(input$ok, {
  aggg_result = -1
  if(aggg_result == -1)
  {
    session$reload()
    return()
  }
})

observeEvent(input$cancel, {
  removeModal()
})
```

Importantly, if you add only the lines of code above, the app will crash when clicking on the "Reset" button of the dialog box
because the R process will stop when the current session will end (which is the expected behavior of the DesktopDeployR framework) before reloading. 
A solution to this problem can be to tell R to stop running only when a session is ended AND when the button 
confirming the refreshing action has NOT been clicked. Below is an example of code that would implement this idea. (You will notice
that in addition to the two first conditions previously evocated [the session is ended AND the button confirming refreshing app (here identified in the code as "ok" and named "Reset" in the UI) has been clicked], there is a third condition related to the number of current users of the app. 
In principle, this is not necessary when your app is for a desktop use only. However, if your app is also used online (eg, on a shinyapps.io plateform), the code below will allow to preserve the currently working sessions.)

**Set the initial number of sessions by adding the following into a global.R file**
```r
users <- shiny::reactiveValues(count = 0)
```
     
**Manage app closure by adding the following into your app_server.R file**
```r     
# Increasing users count when starting new session
  isolate({users$count <- users$count + 1 
  })
  
# Decreasing users count when closing session
# Stopping app when count is 0 AND when the "Reset" button of the dialog box has not been clicked
  session$onSessionEnded(function() {
    isolate({
      users$count = users$count - 1
      if (users$count == 0 && is.null(input$ok)) stopApp()
    })
  })

# The following comments were helpful to build the code: 
# https://stackoverflow.com/questions/47728208/how-many-users-are-connected-to-my-shiny-application
```

### Using a different (newer) version of R
Either replace `./dist/R-Portable/` with the version of `R-Portable` that is
required or modify `./app/config.cfg` to point to the desired R installation
(e.g. a system install).


### Version tracking
Due to their potentially large sizes, it is not recommended that the following
folders be tracked by version control (i.e. Git):

* `/app/library/`
* `/dist/R-Portable`

### Application Structure
```
/<appname>          # - application deployment root
./app/              # - application working directory

	./library/        # - application specific package library

	./shiny/          # - application framework folder (in this case, shiny)
		./global.R      # - global constants and functions for shiny-app
		./server.R      # - server processing function for shiny-app
		./ui.R          # - user interface definition function for shiny-app

	./app.R           # - application launch entry script
	./config.cfg      # - application configuration file
	./packages.txt    # - list of primary package dependencies
	./...             # - other application files

./dist/             # - application launch framework
	./R-Portable/     # - "vanilla" R interpreter (downloaded separately)
	./script/
		./R
			./run.R       # - R environment initialization and application launch
		./wsf
			./js
				./JSON.minify.js  # - JS to JSON minifier, allows comments in JSON files
				./json2.js  # - JSON parsing library
				./run.js    # - OS application launch script
			./run.wsf     # - merges javascript dependencies and launch script
	./USAGE.md        # - notes on how the dist folder is structured

/<appname>.bat      # - batch file to start application
/README.md          # - this file or brief description of application
```
