const fs = require("fs");
const path = require("path");
const { prefix, botName } = require("../helper_commands/settings");

let cachedHelpText = null;
let cacheTimestamp = 0;

module.exports = {
  name: "help",
  description: "Show all available commands",
  ignoreGlobal: true,

  run: async ({ sock, msg }) => {
    // Use cache if available
    if (cachedHelpText) {
      return sock.sendMessage(msg.key.remoteJid, {
        image: fs.readFileSync(path.join(__dirname, "../assets/bot.png")),
        caption: cachedHelpText,
      });
    }

    // Build help text (first run only)
    const commandsPath = __dirname;
    const files = fs.readdirSync(commandsPath);
    const ownerOnlyCommands = [];
    const Commands = [];

    let text = `✨ *${botName} Help Menu*\n`;
    text += `━━━━━━━━━━━━━━━\n`;
    text += `👋 Hi! I’m *${botName}*, here to help you.\n\n`;

    for (const file of files) {
      if (!file.endsWith(".js")) continue;

      const command = require(`./${file}`);
      if (!command.name) continue;

      if (command.ownerOnly) {
        ownerOnlyCommands.push(command);
        // text += `🔹 *${prefix}${command.name}* _(Owners Only)_`;
      } else {
        Commands.push(command);
        // text += `🔹 *${prefix}${command.name}*`;
      }

      // if (command.description) {
      //   text += `\n   _${command.description}_`;
      // }

      // text += `\n\n`;
    }

    text += "━━━━━━━Commands━━━━━━━";
    text += "\n\n";
    for (const command of Commands) {
      text += `🔹 *${prefix}${command.name}*`;
      if (command.description) {
        text += `\n   _${command.description}_`;
      }
      text += "\n\n";
    }

    text += "━━━━━━━━━━━━━━━";
    text += "\n\n";

    text += "━━━━━━━Owners Only Commands━━━━━━━";
    text += "\n\n";

    for (const command of ownerOnlyCommands) {
      text += `🔹 *${prefix}${command.name}*`;
      if (command.description) {
        text += `\n   _${command.description}_`;
      }
      text += "\n\n";
    }

    text += `━━━━━━━━━━━━━━━\n`;
    text += `⚙️ Prefix: \`${prefix}\`\n`;
    text += `🤖 Bot: *${botName}*\n`;
    text += `🚀 Built with ❤️ using Node.js\n`;
    text += `Developers: Ali - Jamal & Bahaa El Rawass`;

    // Cache result
    cachedHelpText = text;
    cacheTimestamp = Date.now();

    await sock.sendMessage(msg.key.remoteJid, {
      image: fs.readFileSync(path.join(__dirname, "../assets/bot.png")),
      caption: text,
    });
  },
};
