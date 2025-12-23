const fs = require("fs");
const { ownerOnly } = require("./autovoice");

module.exports = {
  name: "setname",
  description: "Sets the name of the bot(Restart Required)",
  ownerOnly: true,

  run: async ({ sock, msg, args }) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Usage: .setname <name>",
      });
    }

    const botName = args.join(" ");

    const settings = JSON.parse(fs.readFileSync("./settings.json", "utf8"));
    const previousName = settings.botname
    settings.botname = botName;

    fs.writeFileSync("./settings.json", JSON.stringify(settings));

    await sock.sendMessage(msg.key.remoteJid, {
      text: `🤖 ${previousName}:\nThe name has been set to ${botName} .`,
    });
  },
};
