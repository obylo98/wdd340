const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const utilities = require("../utilities");
const accountModel = require("../models/account-model");
const messageModel = require("../models/message-model");

/**
 * Deliver inbox view get
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */

async function buildInbox(req, res, next) {
  let nav = await utilities.getNav();
  let messages = await messageModel.getMessagesToId(
    res.locals.accountData.account_id
  );
  const archivedMessages = await messageModel.getMessageCountById(
    res.locals.accountData.account_id,
    true
  );

  let inboxTable = utilities.buildInbox(messages);

  res.render("message/inbox", {
    title: `${res.locals.accountData.account_firstname} Inbox`,
    nav,
    errors: null,
    inboxTable,
    archived: false,
    archivedMessages,
    messages: req.flash(),
  });
}

/**
 * Deliver archive view get
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function buildArchive(req, res, next) {
  let nav = await utilities.getNav();
  let messages = await messageModel.getMessagesToId(
    res.locals.accountData.account_id,
    true
  );
  const unarchivedMessages = await messageModel.getMessageCountById(
    res.locals.accountData.account_id,
    false
  );
  let inboxTable = utilities.buildInbox(messages);

  res.render("message/inbox", {
    title: `${res.locals.accountData.account_firstname} Inbox: Archived Messages`,
    nav,
    errors: null,
    inboxTable,
    archived: true,
    unarchivedMessages,
    messages: req.flash(),
  });
}

/**
 * Deliver message view get
 */
async function buildMessageView(req, res, next) {
  const messageId = req.params.messageId;
  const messageData = await messageModel.getMessageById(messageId);

  if (messageData.message_to == res.locals.accountData.account_id) {
    const nav = await utilities.getNav();
    res.render("message/message-view", {
      title: "Message: " + messageData.message_subject,
      nav,
      errors: null,
      messageData,
    });
  } else {
    req.flash("notice", "You aren't authorized to view that message.");
    res.redirect("/message");
  }
}

/**
 * Deliver compose view get
 */
async function buildCompose(req, res, next) {
  const nav = await utilities.getNav();
  const recipientData = await accountModel.getAccountList();
  let title = "Compose";
  let recipientList = "";

  if (req.params.messageId) {
    // Reply path
    const replyTo = await messageModel.getMessageById(req.params.messageId);
    title = `Reply to ${replyTo.account_firstname} ${replyTo.account_lastname}`;
    res.locals.Subject = "Re: " + replyTo.message_subject + " ";
    res.locals.Body = `\n\n\nOn ${replyTo.message_created.toLocaleString()} from ${
      replyTo.account_firstname
    } ${replyTo.account_lastname}:\n${replyTo.message_body}`;
    recipientList = utilities.buildRecipientList(
      recipientData,
      replyTo.account_id
    );
  } else {
    // Compose new path
    recipientList = utilities.buildRecipientList(recipientData);
  }

  res.render("message/compose", {
    title,
    nav,
    errors: null,
    recipientList,
    messages: req.flash(),
  });
}

/**
 * Process send message post
 */
async function sendMessage(req, res, next) {
  try {
    const { message_to, message_subject, message_body } = req.body;
    const sender_id = res.locals.accountData.account_id;

    await messageModel.sendMessage(
      message_to,
      message_subject,
      message_body,
      sender_id
    );

    req.flash("notice", "Message sent successfully!");
    res.redirect("/message");
  } catch (error) {
    console.error("Send message error:", error);
    req.flash("notice", "Error sending message");
    res.redirect("/message/compose");
  }
}

/**
 * Deliver delete confirmation view get
 */
async function buildDelete(req, res, next) {
  let nav = await utilities.getNav();
  const messageData = await messageModel.getMessageById(req.params.messageId);

  res.render("message/delete", {
    title: "Confirm Deletion",
    nav,
    errors: null,
    messageData,
    messages: req.flash(),
  });
}

/**
 * Process delete post

 */
async function deleteMessage(req, res, next) {
  messageModel.deleteMessage(req.body.message_id);
  req.flash("notice", "Message deleted");
  res.redirect("/message");
}

/**
 * Toggle a messages read flag
 */
async function toggleRead(req, res, next) {
  const message_read = await messageModel.toggleRead(req.params.messageId); // Returns the new value of message_read
  return res.json(message_read);
}

/**
 *  Toggle a messages archived flag
 */
async function toggleArchived(req, res, next) {
  const message_read = await messageModel.toggleArchived(req.params.messageId); // Returns the new value of message_read
  return res.json(message_read);
}

module.exports = {
  buildInbox,
  buildMessageView,
  buildCompose,
  sendMessage,
  buildArchive,
  buildDelete,
  deleteMessage,
  toggleRead,
  toggleArchived,
};
