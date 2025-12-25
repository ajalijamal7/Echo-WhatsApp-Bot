const { exec } = require("child_process");
const stopMessages = [
  "🛑 Alright, I’m clocking out. See you later 👋",
  "😴 Going offline. Don’t miss me too much.",
  "⚰️ I regret nothing. Goodbye.",
  "🕯 Gone but not forgotten (until restart).",
  "🙄 Fine. I’ll stop. But this isn’t over.",
  "🚪 I’m leaving. (Slammed the door behind me.)",
  "🔌 Power cord removed emotionally.",
  "💾 Saving nothing… shutting down.",
  "🛑 Process terminated with extreme prejudice.",
];

module.exports = {
  name: "stop",
  description: "Stops the bot",
  ownerOnly: true,

  run: async ({ sock, msg }) => {
    exec("pm2 kill");
    await sock.sendMessage(msg.key.remoteJid, {
      text: stopMessages[Math.floor(Math.random() * stopMessages.length)],
    });
  },
};
