const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

module.exports = {
    name: "trim",
    description: "Trim audio by time (seconds)",

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid
        const ctx = msg.message?.extendedTextMessage?.contextInfo

        if (!ctx?.quotedMessage?.audioMessage) {
            return sock.sendMessage(jid, {
                text: "❌ Reply to an audio with `.trim <start> <end>`"
            })
        }

        if (args.length < 2) {
            return sock.sendMessage(jid, {
                text: "❌ Usage: `.trim <start> <end>`\nExample: `.trim 5 12`"
            })
        }

        const start = parseFloat(args[0])
        const end = parseFloat(args[1])

        if (isNaN(start) || isNaN(end) || start < 0 || end <= start) {
            return sock.sendMessage(jid, {
                text: "❌ Invalid time range"
            })
        }

        const tempDir = path.join(__dirname, "../temp")
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

        const id = crypto.randomBytes(5).toString("hex")
        const input = path.join(tempDir, `trim-in-${id}.mp3`)
        const output = path.join(tempDir, `trim-out-${id}.mp3`)

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

            exec(
                `ffmpeg -y -i "${input}" -ss ${start} -to ${end} -c copy "${output}"`,
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
            console.error("TRIM ERROR:", e)
            await sock.sendMessage(jid, {
                text: "❌ Failed to trim audio"
            })
        }
    }
}
