🤖 Echo — Personal WhatsApp Bot

Echo is a personal WhatsApp bot built with Node.js and Baileys, created for experimentation, learning, and private use.

It is designed to be stable, configurable, and easy to extend, with a clean command system, permission controls, and safe media handling.

Echo responds to messages prefixed with . and can be used in both private chats and groups, depending on configuration.

🎯 Purpose

This project is:

For personal use

For learning and experimentation

Not intended for public deployment or mass usage

Features and structure are built to be clear and maintainable, not bloated.

✨ Current Features
🧠 Command System

Prefix-based commands (.)

Modular command files

Automatic argument parsing

Easy to add or remove commands

🔐 Permissions

Bot owner detection

Per-command restrictions:

Owner-only commands

Group-only commands

Global configuration flags to:

Lock all commands to owner

Lock all commands to groups

🖼️ Stickers

Convert images into valid WhatsApp stickers

Proper image → WEBP conversion

Stickers can be saved and reused

Graceful handling of blocked media

🧱 Stability

Central message handler

Safe async execution

Error handling to prevent crashes

Designed to tolerate WhatsApp media limitations

⚙️ Configuration

All main behavior is controlled from config.js:

module.exports = {
  prefix: '.',
  owner: 'YOUR_NUMBER',
  globalOwnerOnly: false,
  globalGroupOnly: false,
  botName: 'Echo'
}

📂 Project Structure
Echo/
├── auth/               # WhatsApp session data
├── commands/           # Command modules
├── handlers/           # Message handling logic
├── config.js           # Global configuration
├── index.js            # Entry point
└── README.md

🚀 Running the Bot
npm install
node index.js


Scan the QR code with WhatsApp Web to log in.

⚠️ Notes

Media handling depends on WhatsApp Web behavior

Some images may be blocked by WhatsApp servers

This bot is not optimized for public or large-scale use

🧠 Philosophy

Echo is built to be:

Simple

Predictable

Easy to modify

A solid base for future features