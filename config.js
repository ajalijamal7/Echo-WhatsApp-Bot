require('dotenv').config()

module.exports = {
  prefix: '.',
  owners: process.env.OWNERS
    ? process.env.OWNERS.split(',').map(o => o.trim())
    : [],
  globalOwnerOnly: false,
  globalGroupOnly: false,
  botName: 'Echo',
  geminiApiKey: process.env.GEMINI_API_KEY || null,

}
