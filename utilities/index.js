const invModel = require("../models/inventory-model");
const Util = {};
require("dotenv").config();
const jwt = require("jsonwebtoken");

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function (req, res, next) {

  let data = await invModel.getClassifications();
  let list = "<ul>";
  list += '<li><a href="/" title="Home page">Home</a></li>';
  data.rows.forEach((row) => {
    list += "<li>";
    list +=
      '<a href="/inv/type/' +
      row.classification_id +
      '" title="See our inventory of ' +
      row.classification_name +
      ' vehicles">' +
      row.classification_name +
      "</a>";
    list += "</li>";
  });
  list += "</ul>";
  return list;
};

/* **************************************
 * Build the classification view HTML
 * ************************************ */
Util.buildClassificationGrid = async function (data) {
  let grid;
  if (data.length > 0) {
    grid = '<ul id="inv-display">';
    data.forEach((vehicle) => {
      grid += "<li>";
      grid +=
        '<a href="../../inv/detail/' +
        vehicle.inv_id +
        '" title="View ' +
        vehicle.inv_make +
        " " +
        vehicle.inv_model +
        'details"><img src="' +
        vehicle.inv_thumbnail +
        '" alt="Image of ' +
        vehicle.inv_make +
        " " +
        vehicle.inv_model +
        ' on CSE Motors" /></a>';
      grid += '<div class="namePrice">';
      grid += "<hr />";
      grid += "<h2>";
      grid +=
        '<a href="../../inv/detail/' +
        vehicle.inv_id +
        '" title="View ' +
        vehicle.inv_make +
        " " +
        vehicle.inv_model +
        ' details">' +
        vehicle.inv_make +
        " " +
        vehicle.inv_model +
        "</a>";
      grid += "</h2>";
      grid +=
        "<span>$" +
        new Intl.NumberFormat("en-US").format(vehicle.inv_price) +
        "</span>";
      grid += "</div>";
      grid += "</li>";
    });
    grid += "</ul>";
  } else {
    grid += '<p class="notice">Sorry, no matching vehicles could be found.</p>';
  }
  return grid;
};

/* **************************************
 * Build a single listing element from data
 * ************************************ */
Util.buildItemListing = async function (data) {
  let listingHTML = "";
  console.dir({ data });
  if (data) {
    listingHTML = `
        <section class="car-listing">
          <img src="${data.inv_image}" alt="${data.inv_make} ${data.inv_model}">
          <div class="car-information">
            <div>
              <h2>${data.inv_year} ${data.inv_make} ${data.inv_model}</h2>
            </div>
            <div>
              ${Number.parseFloat(data.inv_price).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </div>
            <div class="description">
              <p>
                ${data.inv_description}
              </p>
              <dl>
                <dt>MILEAGE</dt>
                <dd>${data.inv_miles.toLocaleString("en-US", {
                  style: "decimal",
                })}</dd>
                <dt>COLOR</dt>
                <dd>${data.inv_color}</dd>
                <dt>CLASS</dt>
                <dd>${data.classification_name}</dd>
              </dl>
            </div>
  
          </div>
        </section>
      `;
    // listingHTML += '<img src="/images/notexist.jpg">'; // Introduce 404 error
  } else {
    listingHTML = `
        <p>Sorry, no matching vehicles could be found.</p>
      `;
  }
  return listingHTML;
};

/* ****************************************
 * Build the classification list HTML
 **************************************** */
Util.buildClassificationList = async function (classification_id = null) {
  try {
    let data = await invModel.getClassifications();
    if (!data || !data.rows) {
      throw new Error("No classifications found");
    }
    let classificationList =
      '<select name="classification_id" id="classificationList" required>';
    classificationList += "<option value=''>Choose a Classification</option>";
    data.rows.forEach((row) => {
      classificationList += '<option value="' + row.classification_id + '"';
      if (
        classification_id != null &&
        row.classification_id == classification_id
      ) {
        classificationList += " selected ";
      }
      classificationList += ">" + row.classification_name + "</option>";
    });
    classificationList += "</select>";
    return classificationList;
  } catch (error) {
    console.error("Error building classification list:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for
 * General Error Handling
 **************************************** */
Util.handleErrors = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);


/* ****************************************
 * Middleware to check token validity
 **************************************** */
Util.checkJWTToken = (req, res, next) => {
  

  const token = req.cookies.jwt;
  

  if (!token) {
    res.locals.loggedin = false;
    return next(); 
  }

  try {
    const accountData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);


    res.locals.accountData = accountData;
    res.locals.loggedin = true;

    next();
  } catch (error) {
    res.clearCookie("jwt");
    res.locals.loggedin = false;
    next(); 
  }
};

/**
 * Function to update the browser cookie.
 */

Util.updateCookie = (accountData, res) => {
  try {


    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new Error("Missing ACCESS_TOKEN_SECRET in environment variables.");
    }

    const token = jwt.sign(
      {
        account_id: accountData.account_id,
        account_firstname: accountData.account_firstname,
        account_lastname: accountData.account_lastname,
        account_email: accountData.account_email,
        account_type: accountData.account_type,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );


    res.cookie("jwt", token, {
      httpOnly: true, // Prevents client-side JavaScript from accessing it
      secure: false,  // Change to true if using HTTPS
      sameSite: "lax", // Allows navigation without clearing the cookie
      maxAge: 3600000, // 1 hour
    });

  } catch (error) {
    console.error("Error in updateCookie:", error.message);
  }
};

/* ****************************************
 *  Check Login
 * ************************************ */
Util.checkLogin = (req, res, next) => {

  const token = req.cookies.jwt;


  if (!token) {

    req.flash("notice", "Please log in.");
    return res.redirect("/account/login");
  }

  try {
    const accountData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  

    res.locals.accountData = accountData;
    res.locals.loggedin = true;

    next();
  } catch (error) {
    
    req.flash("notice", "Session expired. Please log in again.");
    res.clearCookie("jwt");
    return res.redirect("/account/login");
  }
};

/* ****************************************
 *  Check authorization
 * ************************************ */
Util.checkAuthorizationManager = (req, res, next) => {
  if (req.cookies.jwt) {
    jwt.verify(
      req.cookies.jwt,
      process.env.ACCESS_TOKEN_SECRET,
      function (err, accountData) {
        if (err) {
          req.flash("Please log in");
          res.clearCookie("jwt");
          return res.redirect("/account/login");
        }
        if (
          accountData.account_type == "Employee" ||
          accountData.account_type == "Admin"
        ) {
          next();
        } else {
          req.flash("notice", "You are not authorized to modify inventory.");
          return res.redirect("/account/login");
        }
      }
    );
  } else {
    req.flash("notice", "You are not authorized to modify inventory.");
    return res.redirect("/account/login");
  }
};


/**
 * Build an html table string from the message array
 */
Util.buildInbox = (messages) => {
  inboxList = `
  <table>
    <thead>
      <tr>
        <th>Received</th><th>Subject</th><th>From</th><th>Read</th>
      </tr>
    </thead>
    <tbody>`;

  messages.forEach((message) => {
    inboxList += `
    <tr>
      <td>${message.message_created.toLocaleString()}</td>
      <td><a href="/message/view/${message.message_id}">${message.message_subject}</a></td>
      <td>${message.account_firstname} ${message.account_type}</td>
      <td>${message.message_read ? "✓" : " "}</td>
    </tr>`;
  });

  inboxList += `
  </tbody>
  </table> `;
  return inboxList;
};

Util.buildRecipientList = (recipientData, preselected = null) => {
  let list = `<select name="message_to" required>`;
  list += '<option value="">Select a recipient</option>';

  recipientData.forEach((recipient) => {
    list += `<option ${preselected == recipient.account_id ? "selected" : ""} value="${recipient.account_id}">${recipient.account_firstname} ${recipient.account_lastname}</option>`
  });
  list += "</select>"

  return list;

};
module.exports = Util;
