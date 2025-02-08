/* ******************************************
 * This server.js file is the primary file of the
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const env = require("dotenv").config();
const app = express();
const static = require("./routes/static");
const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const intentionalErrorRoute = require("./routes/intentionalErrorRoute.js");
const utilities = require("./utilities");

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "./layouts/layout"); // not at views root
/* ***********************
 * Routes
 *************************/
app.use(static);
// Inventory routes
app.use("/inv", inventoryRoute);
app.use("/ierror", intentionalErrorRoute);

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT;
const host = process.env.HOST;

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`);
});

// Index Route
app.get("/", baseController.buildHome);
// app.get("/", function(req, res) {
//   res.render("index", { title: "Home" })
// })


/* ***********************
 * 404 Catch-All Route (Handles Unknown Routes)
 *************************/
app.use(async (req, res, next) => {
  console.log(`404 Handler Triggered: ${req.originalUrl}`); // Debugging

  let nav = await utilities.getNav();
  res.status(404).render("errors/error", {
    title: "404 - Not Found",
    message: "The page you're looking for doesn't exist.",
    nav,
  });
});

/* ***********************
 * Global Error Handler (500 & Other Errors)
 *************************/
app.use(async (err, req, res, next) => {
  console.error(`Error at "${req.originalUrl}": ${err.message}`);

  let nav = await utilities.getNav();
  const statusCode = err.status || 500;

  res.status(statusCode).render("errors/error", {
    title: `${statusCode} Error`,
    message:
      statusCode === 404
        ? "Page not found."
        : "Oh no! Something went wrong. Try again later.",
    nav,
  });
});


