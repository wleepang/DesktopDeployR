#' This is an example Shiny application
#' It is the same as example_02 in the RStudio Shiny Tutorial

library(shiny)

server = function(input, output, session) {

  # IMPORTANT!
  # this is needed to terminate the R process when the
  # shiny app session ends. Otherwise, you end up with a zombie process
  session$onSessionEnded(function() {
    stopApp()
  })

  dataset = reactive({
    switch(
      input$dataset,
      "rock" = rock,
      "pressure" = pressure,
      "cars" = cars,
      "iris" = iris)
  })

  output$dataSummary = renderPrint({
    summary(dataset())
  })

  output$dataView = renderTable({
    head(dataset(), n = input$obs)
  })
}
