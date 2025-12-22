const fs = require("fs");

module.exports = {
  name: "resetcooldown",
  description: "Reset the cooldown of the bot",
  ownerOnly: true,

  run: async ({ sock, msg }) => {
    fs.writeFileSync("./cooldown.json", JSON.stringify({ lastRequest: 0 }));

    await sock.sendMessage(msg.key.remoteJid, {
      text: "♻️ The cooldown has been reset",
    });
  },
};
