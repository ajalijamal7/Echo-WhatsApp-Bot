const gTTS = require("gtts")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

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
        const output = path.join(tempDir, `tts-${lang}-${id}.mp3`)

        try {
            const gtts = new gTTS(text, lang)

            await new Promise((resolve, reject) => {
                gtts.save(output, (err) => {
                    if (err) reject(err)
                    else resolve()
                })
            })

            await sock.sendMessage(jid, {
                audio: fs.readFileSync(output),
                mimetype: "audio/mpeg"
            })

        } catch (e) {
            console.error("TTS ERROR:", e)

            await sock.sendMessage(jid, {
                text: "❌ Failed to generate audio (language may be unsupported)"
            })
        } finally {
            if (fs.existsSync(output)) fs.unlinkSync(output)
        }
    }
}
