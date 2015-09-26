# capture the current working directory
# set the package search path to the app specific library
# and the local R-portable site library
appwd = getwd()
applibpath = file.path(appwd, 'app', 'library')

.libPaths(c(applibpath, .Library))

message('library paths:\n', paste('... ', .libPaths(), sep='', collapse='\n'))
message('working path:\n', paste('...', appwd))

# get the application name from the config file
library(jsonlite)
config = fromJSON(file.path(appwd, 'app', 'config.cfg'))

# provide some initialization status updates to assure the user that something
# is happening
pb = winProgressBar(
  title = sprintf('Starting %s ...', config$appname),
  label = 'Initializing ...'
)

# wrap the startup process in tryCatch so that if any errors occur an appropriate
# error message can be displayed
appexit_msg = tryCatch({
  
  packages = config$init_packages
  message('loading packages: ', paste(packages, collapse = ', '))
  
  for (i in seq_along(packages)) {
    setWinProgressBar(pb, i/(length(packages)+1), label = sprintf('Loading package-%s', packages[i]))
    library(packages[i], character.only = TRUE)
  }
  
  setWinProgressBar(pb, 1.00, label = 'Starting application')
  close(pb)
  
  ## app is launched in the system default browser (if FF or Chrome, should work fine, IE needs to be >= 10)
  #runApp("./app/shiny/", launch.browser=TRUE)
  source('./app/app.R')
  
  'application terminated normally'
},
error = function(e) {
  msg = sprintf('Startup failed with error(s):\n\n%s', e$message)
  tcltk::tk_messageBox(
    type="ok", 
    message=msg,
    icon="error")
  
  msg
},
finally = {
  close(pb)
})

message(appexit_msg)