// commands/pitchhigh.js
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")

module.exports = {
    name: "pitchhigh",
    description: "Increase audio pitch",

    run: async ({ sock, msg }) => {
        const jid = msg.key.remoteJid
        const ctx = msg.message?.extendedTextMessage?.contextInfo

        if (!ctx?.quotedMessage?.audioMessage) {
            return sock.sendMessage(jid, { text: "❌ Reply to an audio with `.pitchhigh`" })
        }

        const tempDir = path.join(__dirname, "../temp")
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

        const input = path.join(tempDir, "in.mp3")
        const output = path.join(tempDir, "out.mp3")

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
                { logger: sock.logger, reuploadRequest: sock.updateMediaMessage }
            )

            fs.writeFileSync(input, buffer)

            exec(
                `ffmpeg -y -i "${input}" -af "rubberband=pitch=1.25" "${output}"`,
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
            console.error("PITCH HIGH ERROR:", e)
            sock.sendMessage(jid, { text: "❌ Failed to edit audio" })
        }
    }
}
