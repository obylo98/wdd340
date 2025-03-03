/* ******************************************
 * This server.js file is the primary file of the
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const express = require("express");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const env = require("dotenv").config();
const app = express();
const static = require("./routes/static");
const cookieParser = require("cookie-parser");
const accountRoute = require("./routes/accountRoute");
const messageRoute = require("./routes/messageRoute");
const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const intentionalErrorRoute = require("./routes/intentionalErrorRoute.js");
const utilities = require("./utilities");
const pool = require("./database");

// Cookie parser
app.use(cookieParser())

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("layout", "./layouts/layout"); // not at views root
app.use(
  session({
    store: new (require("connect-pg-simple")(session))({
      createTableIfMissing: true,
      pool,
    }),
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    name: "sessionId",
  })
);
app.use(require("connect-flash")());
/* ***********************
 * Routes
 *************************/
app.use(static);
// Inventory routes
app.use("/inv", inventoryRoute);
app.use("/account", accountRoute);
// Message routes
app.use("/message", messageRoute);
app.use("/ierror", intentionalErrorRoute);



// JWT checker
app.use(utilities.checkJWTToken);
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
