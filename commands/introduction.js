const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const gTTS = require("gtts");
const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const config = require("../config");
const { botName } = require("../helper_commands/settings");
const HelpCommand = require("./help");

function resolveBinary(winName, unixName) {
  const local = path.join(__dirname, "..", "bin", winName);
  if (process.platform === "win32" && fs.existsSync(local)) {
    return local;
  }
  return unixName;
}

const FFMPEG = resolveBinary("ffmpeg.exe", "ffmpeg");

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
    gtts.save(out, (err) => (err ? rej(err) : res()));
  });
}

async function elevenLabsTTS(text, out) {
  const client = new ElevenLabsClient({
    apiKey: config.elevenlabs.apiKey,
  });

  const stream = await client.textToSpeech.convert(config.elevenlabs.voiceId, {
    text,
    modelId: "eleven_multilingual_v2",
    outputFormat: "mp3_44100_128",
  });

  const w = fs.createWriteStream(out);
  stream.pipe(w);

  await new Promise((res, rej) => {
    w.on("finish", res);
    w.on("error", rej);
  });
}

module.exports = {
  name: "introduction",
  description: `${botName} Introduction message`,

  run: async ({ sock, msg }) => {
    const jid = msg.key.remoteJid;

    const text =
      `Hello! I’m ${botName}.\nI’m your personal whatsApp assistant designed to help you inside whatsapp.\nI can download media, manage groups, and automate tasks.\nLet’s get started.`.trim();
    await sock.sendMessage(jid, { text });

    const tempDir = path.join(__dirname, "../temp");
    fs.mkdirSync(tempDir, { recursive: true });

    const mp3 = path.join(tempDir, "tts.mp3");
    const opus = path.join(tempDir, "tts.opus");

    const clean = cleanText(text);

    try {
      if (config.elevenlabs?.apiKey) {
        try {
          await elevenLabsTTS(clean, mp3);
        } catch {
          await googleTTS(clean, mp3);
        }
      } else {
        await googleTTS(clean, mp3);
      }

      await new Promise((res, rej) => {
        exec(
          `"${FFMPEG}" -y -i "${mp3}" -ac 1 -ar 48000 -c:a libopus "${opus}"`,
          (err) => (err ? rej(err) : res())
        );
      });

      await sock.sendMessage(jid, {
        audio: fs.readFileSync(opus),
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
      });

      HelpCommand.run({sock, msg});
    } catch (err) {
      console.error("INTRODUCTION TTS ERROR:", err);
      await sock.sendMessage(jid, {
        text: "❌ Failed to generate voice message.",
      });
    } finally {
      [mp3, opus].forEach((f) => fs.existsSync(f) && fs.unlinkSync(f));
    }
  },
};
