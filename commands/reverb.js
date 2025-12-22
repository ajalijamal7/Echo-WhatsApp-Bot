const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

module.exports = {
    name: "reverb",
    description: "Add reverb effect to audio",

    run: async ({ sock, msg }) => {
        const jid = msg.key.remoteJid
        const ctx = msg.message?.extendedTextMessage?.contextInfo

        if (!ctx?.quotedMessage?.audioMessage) {
            return sock.sendMessage(jid, {
                text: "❌ Reply to an audio with `.reverb`"
            })
        }

        const tempDir = path.join(__dirname, "../temp")
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

        const id = crypto.randomBytes(5).toString("hex")
        const input = path.join(tempDir, `reverb-in-${id}.mp3`)
        const output = path.join(tempDir, `reverb-out-${id}.mp3`)

        const mediaMsg = {
            key: {
                remoteJid: jid,
                fromMe: false,
                id: ctx.stanzaId,
                participant: ctx.participant
            },
            message: ctx.quotedMessage
        }

        try {
            const buffer = await downloadMediaMessage(
                mediaMsg,
                "buffer",
                {},
                {
                    logger: sock.logger,
                    reuploadRequest: sock.updateMediaMessage
                }
            )

            fs.writeFileSync(input, buffer)

            // aecho = ffmpeg reverb/echo filter
            exec(
                `ffmpeg -y -i "${input}" -filter:a "aecho=0.8:0.9:1000:0.3" "${output}"`,
                async (err) => {
                    if (err) throw err

                    await sock.sendMessage(jid, {
                        audio: fs.readFileSync(output),
                        mimetype: "audio/mpeg"
                    })

                    fs.unlinkSync(input)
                    fs.unlinkSync(output)
                }
            )

        } catch (e) {
            console.error("REVERB ERROR:", e)
            sock.sendMessage(jid, {
                text: "❌ Failed to apply reverb"
            })
        }
    }
}
