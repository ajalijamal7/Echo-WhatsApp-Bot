require("dotenv").config();

module.exports = {
  owners: process.env.OWNERS
    ? process.env.OWNERS.split(",").map((o) => o.trim())
    : [],

  globalOwnerOnly: false,
  globalGroupOnly: false,

  geminiApiKey: process.env.GEMINI_API_KEY || null,
  summaryApiKey: process.env.SUMMARY_API_KEY || null,

  REMOVE_BG_API_KEY: process.env.REMOVE_BG_API_KEY || null,

  aimlApiKey: process.env.AIML_API_KEY || null, 

  voiceEngine: "elevenlabs",
  autovoice: false,

  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || null,
    voiceId: "6AUOG2nbfr0yFEeI0784",
  },

  github_auth_token: process.env.GITHUB_AUTH_TOKEN || null,
};