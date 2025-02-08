/**
 * This controller exists to create an exception for testing
 */

const errorController = {};

errorController.triggerError = async function (req, res, next) {
  // Trigger a 500 error
  console.log("Causing an error...");
  let aNumber = 1/0;
  throw new Error("This is an intentional error.");
  // The render templates expect data that is not being provided. This will also cause an exception.
  res.render("./", {
      title: "Intentional Error",
  })
};

module.exports = errorController;
