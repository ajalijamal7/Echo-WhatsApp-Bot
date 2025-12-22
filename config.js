require("dotenv").config();
const fs = require("fs");

function getPrefix() {
  const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));
  return settings.prefix;
}

function getBotName(){
  const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));
  return settings.botname
}

module.exports = {
  prefix: getPrefix(),
  owners: process.env.OWNERS
    ? process.env.OWNERS.split(",").map((o) => o.trim())
    : [],
  globalOwnerOnly: false,
  globalGroupOnly: false,
  botName: getBotName(),
  geminiApiKey: process.env.GEMINI_API_KEY || null,
  REMOVE_BG_API_KEY: process.env.REMOVE_BG_API_KEY || null,
};
