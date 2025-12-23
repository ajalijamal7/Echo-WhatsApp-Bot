const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const gTTS = require("gtts");
const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const config = require("../config");

ffmpeg.setFfmpegPath(ffmpegPath);

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
        gtts.save(out, err => err ? rej(err) : res());
    });
}

async function elevenLabsTTS(text, out) {
    const client = new ElevenLabsClient({
        apiKey: config.elevenlabs.apiKey
    });

    const stream = await client.textToSpeech.convert(
        config.elevenlabs.voiceId,
        {
            text,
            modelId: "eleven_multilingual_v2",
            outputFormat: "mp3_44100_128"
        }
    );

    const w = fs.createWriteStream(out);
    stream.pipe(w);

    await new Promise((res, rej) => {
        w.on("finish", res);
        w.on("error", rej);
    });
}

async function maybeAutoVoice(sock, jid, text) {
    if (!config.autovoice) return;

    const clean = cleanText(text);

    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const mp3 = path.join(tempDir, "av.mp3");
    const opus = path.join(tempDir, "av.opus");

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
        ffmpeg(mp3)
            .audioFrequency(48000)
            .audioChannels(1)
            .audioCodec("libopus")
            .format("ogg")
            .save(opus)
            .on("end", res)
            .on("error", rej);
    });

    await sock.sendMessage(jid, {
        audio: fs.readFileSync(opus),
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
    });

    [mp3, opus].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
}

module.exports = { maybeAutoVoice };
