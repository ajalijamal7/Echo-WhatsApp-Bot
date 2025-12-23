const gTTS = require("gtts")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const ffmpeg = require("fluent-ffmpeg")
const ffmpegPath = require("ffmpeg-static")

const botConfig = require("../settings.json")

ffmpeg.setFfmpegPath(ffmpegPath)

function normalizeGender(gender) {
    return gender?.toLowerCase() === "male" ? "male" : "female"
}

module.exports = {
    name: "tts",
    description: "Convert text to speech (supports languages)",

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid

        if (!args.length) {
            return sock.sendMessage(jid, {
                text:
                    "❌ Usage:\n" +
                    ".tts <text>\n" +
                    ".tts <lang> <text>\n\n" +
                    "Example:\n" +
                    ".tts hello world\n" +
                    ".tts ar مرحبا كيفك"
            })
        }

        let lang = "en"
        let text = args.join(" ")

        if (args.length > 1 && args[0].length === 2) {
            lang = args[0]
            text = args.slice(1).join(" ")
        }

        if (!text) {
            return sock.sendMessage(jid, {
                text: "❌ Please provide text to convert"
            })
        }

        const tempDir = path.join(__dirname, "../temp")
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

        const id = crypto.randomBytes(5).toString("hex")
        const rawMp3 = path.join(tempDir, `tts-raw-${id}.mp3`)
        const finalOpus = path.join(tempDir, `tts-${lang}-${id}.opus`)

        try {
            
            const gtts = new gTTS(text, lang)

            await new Promise((resolve, reject) => {
                gtts.save(rawMp3, (err) => {
                    if (err) reject(err)
                    else resolve()
                })
            })

            
            const gender = normalizeGender(botConfig.gender)

            await new Promise((resolve, reject) => {
                ffmpeg(rawMp3)
                    .audioFilters(
                        gender === "male"
                            ? "asetrate=44100*0.9,atempo=1.05"
                            : "asetrate=44100*1.05,atempo=0.95"
                    )
                    .audioCodec("libopus")
                    .save(finalOpus)
                    .on("end", resolve)
                    .on("error", reject)
            })

            
            await sock.sendMessage(jid, {
                audio: fs.readFileSync(finalOpus),
                mimetype: "audio/ogg; codecs=opus",
                ptt: true
            })

        } catch (e) {
            console.error("TTS ERROR:", e)

            await sock.sendMessage(jid, {
                text: "❌ Failed to generate audio (language may be unsupported)"
            })
        } finally {
            if (fs.existsSync(rawMp3)) fs.unlinkSync(rawMp3)
            if (fs.existsSync(finalOpus)) fs.unlinkSync(finalOpus)
        }
    }
}
