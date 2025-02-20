const invModel = require("../models/inventory-model");
const utilities = require("../utilities/");

const invCont = {};

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId;
  const data = await invModel.getInventoryByClassificationId(classification_id);
  const grid = await utilities.buildClassificationGrid(data);
  let nav = await utilities.getNav();
  const className = data[0].classification_name;
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  });
};

invCont.buildByInventoryId = async function (req, res, next) {
  const inventoryId = req.params.inventoryId;
  const data = await invModel.getInventoryByInventoryId(inventoryId);
  const listing = await utilities.buildItemListing(data[0]);
  let nav = await utilities.getNav();
  const itemName = `${data[0].inv_make} ${data[0].inv_model}`;

  res.render("inventory/listing", {
    title: itemName,
    nav,
    listing,
  });
};

/**********************************
 * Vehicle Management Controllers
 **********************************/

/**
 * Build the main vehicle management view
 */
invCont.buildManagementView = async function (req, res, next) {
  let nav = await utilities.getNav();
  const classificationSelect = await utilities.buildClassificationList();
  res.render("inventory/management", {
    title: "Vehicle Management",
    errors: null,
    nav,
    classificationSelect,
    messages: {},
  });
};

/**
 * Build the add classification view
 */
invCont.buildAddClassification = async function (req, res, next) {
  let nav = await utilities.getNav();

  res.render("inventory/addClassification", {
    title: "Add New Classification",
    nav,
    errors: null,
    messages: req.flash(),
  });
};
/**
 * Handle post request to add a vehicle classification
 */
invCont.addClassification = async function (req, res, next) {
  try {

    const { classification_name } = req.body;

    const response = await invModel.addClassification(classification_name);
    let nav = await utilities.getNav(); // Update navigation

    if (response && response.rowCount > 0) {
      req.flash("notice", `The "${classification_name}" classification was successfully added.`);
      res.render("inventory/management", {
        title: "Vehicle Management",
        errors: null,
        nav,
        messages: req.flash(),
      });
    } else {
      req.flash("error", `Failed to add ${classification_name}`);
      res.render("inventory/addClassification", {
        title: "Add New Classification",
        errors: null,
        nav,
        classification_name,
        messages: req.flash(),
      });
    }
  } catch (error) {
    console.error(" Full Error in addClassification:", error);
    res.send(`Error occurred: ${error.message}`);
    next(error);
  }
};

/**
 * Build the add inventory view
 */
invCont.buildAddInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav();
    let classifications = await utilities.buildClassificationList();

    res.render("inventory/addInventory", {
      title: "Add Vehicle",
      errors: null,
      nav,
      classifications,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Rendering error in buildAddInventory:", error.message);
    res.send(`Error rendering page: ${error.message}`);
    next(error);
  }
};


/**
 * Handle post request to add a vehicle to the inventory along with redirects
 */
invCont.addInventory = async function (req, res, next) {
  try {

    const {
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id,
    } = req.body;

    const response = await invModel.addInventory(
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id
    );

    let nav = await utilities.getNav(); // Update navigation

    if (response && response.rowCount > 0) {
      req.flash("notice", `The ${inv_year} ${inv_make} ${inv_model} was successfully added.`);
      res.render("inventory/management", {
        title: "Vehicle Management",
        errors: null,
        nav,
        classificationSelect: await utilities.buildClassificationList(),
        messages: req.flash(),
      });
    } else {
      req.flash("error", `Failed to add ${inv_make} ${inv_model}`);
      res.render("inventory/addInventory", {
        title: "Add Vehicle",
        errors: null,
        nav,
        classifications: await utilities.buildClassificationList(),
        messages: req.flash(),
      });
    }
  } catch (error) {
    console.error(" Full Error in addInventory:", error);
    res.send(` Error occurred: ${error.message}`);
    next(error);
  }
};



module.exports = invCont;
