# Echo Your Personal WhatsApp Bot

Echo is your personal WhatsApp bot built with Node.js and Baileys, created for experimentation, learning, and private use.

It is designed to be easily configurable, and easy to add commands, with a clean command system, permission controls, and safe media handling.

Echo responds to messages prefixed with `.` and can be used in both private chats and groups, depending on configuration.

## Echo's Purpose

This project is intended for personal use and learning and experimental purposes

Features and structure are built to be clear and maintainable.

## Current Features

### Command System

Echo uses prefixed based commands to respond

Easy to add or remove commands

## Permissions

There are some commands which can be only used by the owners of the bot, or in groups only.

Commands can be configured to be only used by the owners of bot or in groups only.

## Stickers

Echo can convert images into valid WhatsApp stickers

Stickers can be saved and reused later

## Stability

Central message handler

Safe asynchronous execution

Careful error handling to prevent crashes

Designed to tolerate WhatsApp media limitations

## Configuration

All main behavior is controlled from config.js

## Running the Bot

1. Run the [install dependencies](installDependencies.bat) file
2. Run the [create .env](create-env.ps1) file to create the .env file and follow the instructions inside
3. Start the bot using the [run](run.bat) file
4. Scan the QR code with WhatsApp to log in.
5. Close the terminal when you want to stop the bot

## Notes

Media handling depends on WhatsApp Web behavior

Some images may be blocked by WhatsApp servers

This bot is not optimized for public or large-scale use
