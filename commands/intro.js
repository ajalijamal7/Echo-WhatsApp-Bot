const fs = require("fs");
const path = require("path");
const gTTS = require("gtts");
const { botName } = require("../helper_commands/settings");
const HelpCommand = require("./help");

const DEFAULT_BOT_NAME = "Echo";

function cleanText(text) {
  return text
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .replace(/[*_~`>|#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function googleTTS(text, out) {
  const gtts = new gTTS(text, "en");
  await new Promise((res, rej) => {
    gtts.save(out, err => (err ? rej(err) : res()));
  });
}

module.exports = {
  name: "intro",
  description: `${botName} Introduction message`,

  run: async ({ sock, msg }) => {
    const jid = msg.key.remoteJid;

    const text = `
Hello. I’m ${botName}.
Your personal WhatsApp assistant.
I help you download media, manage groups, and automate tasks.
Let’s get started.
    `.trim();

    await sock.sendMessage(jid, { text });

    const assetsDir = path.join(__dirname, "../assets");
    const storedVoice = path.join(assetsDir, "intro_voice.ogg");

    fs.mkdirSync(assetsDir, { recursive: true });

    try {
      const mustGenerate =
        !fs.existsSync(storedVoice) || botName !== DEFAULT_BOT_NAME;


      if (mustGenerate) {
        console.log("🎤 Generating intro voice via Google TTS");

        const clean = cleanText(text);
        await googleTTS(clean, storedVoice);

        console.log("✅ Intro voice generated");
      }


      await sock.sendMessage(jid, {
        audio: fs.readFileSync(storedVoice),
        mimetype: "audio/mpeg",
        ptt: true,
      });

      HelpCommand.run({ sock, msg });

    } catch (err) {
      console.error("INTRO VOICE ERROR:", err);
      await sock.sendMessage(jid, {
        text: "❌ Failed to play introduction voice.",
      });
    }
  },
};
