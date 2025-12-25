const gTTS = require("gtts")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const { exec } = require("child_process")
const botConfig = require("../settings.json")

function resolveBinary(winName, unixName) {
    const local = path.join(__dirname, "..", "bin", winName)
    if (process.platform === "win32" && fs.existsSync(local)) {
        return `"${local}"`
    }
    return unixName
}

const FFMPEG = resolveBinary("ffmpeg.exe", "ffmpeg")

function normalizeGender(gender) {
    return gender?.toLowerCase() === "male" ? "male" : "female"
}

module.exports = {
    name: "tts",
    description: "Convert text to speech (normal WhatsApp speed)",

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
        fs.mkdirSync(tempDir, { recursive: true })

        const id = crypto.randomBytes(5).toString("hex")
        const rawMp3 = path.join(tempDir, `tts_raw_${id}.mp3`)
        const finalOpus = path.join(tempDir, `tts_${lang}_${id}.opus`)

        try {
            const gtts = new gTTS(text, lang)

            await new Promise((res, rej) => {
                gtts.save(rawMp3, err => err ? rej(err) : res())
            })

            const gender = normalizeGender(botConfig.gender)

            const tempo =
                gender === "male"
                    ? "atempo=0.98"
                    : "atempo=1.02"

            await new Promise((res, rej) => {
                exec(
                    `${FFMPEG} -y -i "${rawMp3}" ` +
                    `-af "${tempo}" ` +
                    `-ac 1 -ar 48000 -c:a libopus "${finalOpus}"`,
                    err => err ? rej(err) : res()
                )
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
