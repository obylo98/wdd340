const express = require("express");
const router = new express.Router();
const errorController = require("../controllers/intentionalErrorController");
const utilities = require("../utilities");

// Route to trigger error
router.use("/", utilities.handleErrors(async (req, res, next) => {
    // throw new Error("Middleware intentionally throwing an exception") // Comment this line to allow controller to cause the error
    next();
}));

// Route to cause 500 type error
router.get("/", utilities.handleErrors(errorController.triggerError));

module.exports = router;

