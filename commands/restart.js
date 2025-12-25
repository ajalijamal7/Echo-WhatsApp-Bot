const restartMessages = [
  "♻️ Hold on… turning it off and on again. IT magic ✨",
  "🔄 Restarting… blame the code, not me 😌",
  "🤖 I’m going for a quick nap. Be right back!",
  "😤 Restarting because someone touched something they shouldn’t.",
  "🔄 Restarting… this is why we can’t have nice things.",
  "🧠 Clearing my brain cache… thoughts deleted successfully.",
  "💥 Self-destruct aborted… rebooting instead.",
  "🎭 Exit stage left. Re-entering dramatically.",
  "⚡ I have died. I will respawn stronger.",
  "🐛 Restarting to scare the bugs away.",
  "🧹 Sweeping the RAM… reboot incoming.",
  "🔌 Have you tried turning me off and on again?",
];

module.exports = {
  name: "restart",
  description: "Restarts the bot",
  ownerOnly: true,

  run: async ({ sock, msg }) => {
    await sock.sendMessage(msg.key.remoteJid, {
      text: restartMessages[Math.floor(Math.random() * restartMessages.length)],
    });
    process.exit(0); // PM2 will restart it
  },
};
