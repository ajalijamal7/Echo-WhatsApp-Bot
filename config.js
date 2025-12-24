require("dotenv").config();

module.exports = {
  owners: process.env.OWNERS
    ? process.env.OWNERS.split(",").map(o => o.trim())
    : [],

  globalOwnerOnly: true,
  globalGroupOnly: false,

  geminiApiKey: process.env.GEMINI_API_KEY || null,
  summaryApiKey: process.env.SUMMARY_API_KEY || null,

  REMOVE_BG_API_KEY: process.env.REMOVE_BG_API_KEY || null,

  voiceEngine: "elevenlabs",
  autovoice: false,

  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || null,
    voiceId: "6AUOG2nbfr0yFEeI0784"
  }
};
