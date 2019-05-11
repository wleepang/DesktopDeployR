#' This is an example shiny application
#' It is the same as example_02 in the RStudio Shiny Tutorial

library(shiny)

ui = fluidPage(
  titlePanel("Example Shiny App"),
  sidebarLayout(

    sidebarPanel(
      selectInput(
        inputId = "dataset",
        label = "Choose a dataset",
        choices = c("rock", "pressure", "cars", "iris")),

      numericInput(
        inputId = "obs",
        label = "Number of observations to view:",
        value = 10)
    ),

    mainPanel(
      tags$div(sprintf("Global Variable Value: %s", GLOBAL_VAR)),
      verbatimTextOutput("dataSummary"),
      tableOutput("dataView")
    )
  )
)
