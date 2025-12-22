const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config");
const memory = require("../helper_commands/memory");
const cooldown = require("../helper_commands/cooldown");

function getSenderNumber(msg) {
  const senderJid = msg.key.participant || msg.key.remoteJid;
  const senderNumber = senderJid?.replace(/\D/g, "");
  return senderNumber;
}

module.exports = {
  name: `ask${config.botName.toLocaleLowerCase()}`,
  description:`Ask ${config.botName} a question(it is a LIMITED feature)`,

  run: async ({ sock, msg, args }) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Usage: .ask${config.botName} <question>`,
      });
    }

    const number = getSenderNumber(msg);
    const userQuestion = args.join(" ");

    try {
      const userState = memory.getUserState(number);

      const cooldownStatus = cooldown.checkGlobalCooldown();

      if (cooldownStatus.blocked) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⏳ ${config.botName} is cooling down.\nPlease wait ${cooldown.formatTime(
            cooldownStatus.remainingMs
          )}.`,
        });
      }

      const genAI = new GoogleGenerativeAI(config.geminiApiKey);

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: userState.systemSent
          ? undefined
          : memory.SYSTEM_PROMPT,
      });

      const contents = memory.buildContents(userState.history, userQuestion);

      const result = await model.generateContent({ contents });
      const reply = result.response.text();

      // Save memory
      memory.updateUserHistory(number, "user", userQuestion);
      memory.updateUserHistory(number, "model", reply);
      cooldown.updateGlobalCooldown();

      if (!userState.systemSent) {
        memory.markSystemSent(number);
      }

      await sock.sendMessage(msg.key.remoteJid, {
        text: `🤖 *${config.botName}:*\n\n${reply}`,
      });
    } catch (err) {
      console.error("GEMINI ERROR:", err);

      await sock.sendMessage(msg.key.remoteJid, {
        text: `🤖 *${config.botName}:*\n\n${memory.handleGeminiError(err)}`,
      });
    }
  },
};
