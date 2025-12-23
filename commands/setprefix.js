const fs = require("fs");
const { ownerOnly } = require("./autovoice");

module.exports = {
  name: "setprefix",
  description: "Sets the prefix of the bot(Restart Required)",
  ownerOnly: true,

  run: async ({ sock, msg, args }) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Usage: .setprefix <prefix>",
      });
    }

    const userPrefix = args.join(" ");

    const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));
    settings.prefix = userPrefix;

    fs.writeFileSync("./settings.json", JSON.stringify(settings));

    await sock.sendMessage(msg.key.remoteJid, {
      text: `🤖 ${settings.botname}:\nThe Prefix has been set to ${userPrefix} .`,
    });
  },
};
