const { botName } = require("../helper_commands/settings");

module.exports = {
  name: "say",
  description: "Says what you want it to say",

  run: async ({ sock, msg, args }) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Usage: .say <message>",
      });
    }

    const message = args.join(" ");

    await sock.sendMessage(msg.key.remoteJid, {
      text: `🤖 ${botName} Says:\n${message}`,
    });
  },
};
