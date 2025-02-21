const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const utilities = require("../utilities");
const accountModel = require("../models/account-model");
const messageModel = require("../models/message-model");


/* ****************************************
 *  Deliver registration view
 * *************************************** */
async function buildRegister(req, res, next) {
  let nav = await utilities.getNav();
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
    messages: req.flash(),
  });
}

/* ****************************************
 *  Process Registration
 * *************************************** */
async function registerAccount(req, res) {
  let nav = await utilities.getNav();
  const {
    account_firstname,
    account_lastname,
    account_email,
    account_password,
  } = req.body;

  // Hash the password before storing
  let hashedPassword;
  try {
    // regular password and cost (salt is generated automatically)
    hashedPassword = await bcrypt.hashSync(account_password, 10);
  } catch (error) {
    req.flash(
      "notice",
      "Sorry, there was an error processing the registration."
    );
    res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    });
  }

  const regResult = await accountModel.registerAccount(
    account_firstname,
    account_lastname,
    account_email,
    hashedPassword
  );

  if (regResult) {
    req.flash(
      "notice",
      `Congratulations, you\'re registered ${account_firstname}. Please log in.`
    );
    res.status(201).render("account/login", {
      title: "Login",
      errors: null,
      nav,
      messages: req.flash(),
    });
  } else {
    req.flash("notice", "Sorry, the registration failed.");
    res.status(501).render("account/register", {
      title: "Registration",
      errors: null,
      nav,
      messages: req.flash(),
    });
  }
}

/* ****************************************
 *  Deliver login view
 * *************************************** */
async function buildLogin(req, res, next) {
  try {
    let nav = await utilities.getNav();
    
    res.render("account/login", {
      title: "Login",
      errors: null,
      nav,
      messages: req.flash(),
    });
  } catch (error) {
    console.error(" Error in buildLogin:", error);
    res.send(`Error occurred: ${error.message}`);
    next(error);
  }
}

/* ****************************************
 *  Process login post request
 * ************************************ */
async function accountLogin(req, res) {
  try {
    
    let nav = await utilities.getNav();
    const { account_email, account_password } = req.body;

    // Fetch account details from DB
    const accountData = await accountModel.getAccountByEmail(account_email);

    if (!accountData) {
      req.flash("notice", "Invalid email or password.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
        messages: req.flash(),
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(account_password, accountData.account_password);
    if (!passwordMatch) {
      req.flash("notice", "Invalid email or password.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
        messages: req.flash(),
      });
    }

    // Store user data in session or generate JWT token
    delete accountData.account_password;
    
    utilities.updateCookie(accountData, res);
    
    
    return res.redirect("/account/");
  } catch (error) {
    console.error("Full Error in accountLogin:", error);
    res.status(500).send(`Error occurred: ${error.message}`);
  }
}

/**
 * Process account management get request
 */
async function buildAccountManagementView(req, res) {
  try {

    let nav = await utilities.getNav();
    console.log("Navigation loaded successfully");

    const unread = await messageModel.getMessageCountById(res.locals.accountData.account_id);

    res.render("account/account-management", {
      title: "Account Management",
      nav,
      errors: null,
      unread,
      messages: req.flash() 
    });
  } catch (error) {
    console.error(" Error in buildAccountManagementView:", error.message);
    res.status(500).send(`Error occurred: ${error.message}`);
  }
}

/* ****************************************
 *  Process logout request
 * ************************************ */
async function accountLogout(req, res) {
  res.clearCookie("jwt")
  delete res.locals.accountData;
  res.locals.loggedin = 0;
  req.flash("notice", "Logout successful.")
  res.redirect("/");
  return; 

}

/* ****************************************
 *  Deliver account update view get
 * *************************************** */
async function buildUpdate(req, res, next) {
  let nav = await utilities.getNav();

  const accountDetails = await accountModel.getAccountById(req.params.accountId);
  const {account_id, account_firstname, account_lastname, account_email} = accountDetails;
  res.render("account/update", {
    title: "Update",
    nav,
    errors: null,
    account_id,
    account_firstname,
    account_lastname,
    account_email
  });
}

/* ****************************************
 *  Process account update post
 * *************************************** */
async function updateAccount(req, res) {
  let nav = await utilities.getNav();
  const {
    account_id,
    account_firstname,
    account_lastname,
    account_email,
    // account_password,
  } = req.body;

  const regResult = await accountModel.updateAccount(
    account_id,
    account_firstname,
    account_lastname,
    account_email,
  );

  if (regResult) {
    req.flash(
      "notice",
      `Congratulations, you've updated ${account_firstname}.`
    );

    //Update the cookie accountData
  

    const accountData = await accountModel.getAccountById(account_id); // Get it from db so we can remake the cookie
    delete accountData.account_password;
    res.locals.accountData.account_firstname = accountData.account_firstname; // So it displays correctly
    utilities.updateCookie(accountData, res); // Remake the cookie with new data

    res.status(201).render("account/account-management", {
      title: "Management",
      errors: null,
      nav,
    });
  } else {
    req.flash("notice", "Sorry, the update failed.");
    res.status(501).render("account/update", {
      title: "Update",
      errors: null,
      account_id,
      account_firstname,
      account_lastname,
      account_email,
      nav,
    });
  }
}


/* ****************************************
 *  Process account password update post
 * *************************************** */
async function updatePassword(req, res) {
  let nav = await utilities.getNav();

  const { account_id, account_password } = req.body;

  // Hash the password before storing.
  let hashedPassword;
  try {
    // regular password and cost (salt is generated automatically)
    hashedPassword = await bcrypt.hashSync(account_password, 10);
  } catch (error) {
    req.flash(
      "notice",
      "Sorry, there was an error processing the password update."
    );
    res.status(500).render("account/update", {
      title: "Update",
      nav,
      errors: null,
    });
  }

  const regResult = await accountModel.updatePassword(account_id, hashedPassword);

  if (regResult) {
    req.flash(
      "notice",
      `Congratulations, you've updated the password.`
    );
    res.status(201).render("account/account-management", {
      title: "Manage",
      errors: null,
      nav,
    });
  } else {
    req.flash("notice", "Sorry, the password update failed.");
    res.status(501).render("account/update", {
      title: "Update",
      errors: null,
      nav,
    });
  }
}


module.exports = { 
  buildLogin, 
  buildRegister, 
  registerAccount, 
  accountLogin, 
  buildAccountManagementView, 
  accountLogout, 
  buildUpdate, 
  updateAccount, 
  updatePassword };
