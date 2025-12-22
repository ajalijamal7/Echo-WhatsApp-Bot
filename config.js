require("dotenv").config();

module.exports = {
  owners: process.env.OWNERS
    ? process.env.OWNERS.split(",").map((o) => o.trim())
    : [],
  globalOwnerOnly: false,
  globalGroupOnly: false,
  geminiApiKey: process.env.GEMINI_API_KEY || null,
  REMOVE_BG_API_KEY: process.env.REMOVE_BG_API_KEY || null,
};
