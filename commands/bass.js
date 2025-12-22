// commands/bass.js
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")

module.exports = {
    name: "bass",
    description: "Boost bass (optional strength)",

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid
        const ctx = msg.message?.extendedTextMessage?.contextInfo

        if (!ctx?.quotedMessage?.audioMessage) {
            return sock.sendMessage(jid, {
                text: "❌ Reply to an audio with `.bass [1-30]`\nExample: `.bass 15`"
            })
        }


        let gain = 15
        if (args?.[0]) {
            const parsed = parseInt(args[0])
            if (!isNaN(parsed)) {
                gain = Math.max(1, Math.min(parsed, 30))
            }
        }

        const tempDir = path.join(__dirname, "../temp")
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

        const input = path.join(tempDir, `bass-in-${Date.now()}.mp3`)
        const output = path.join(tempDir, `bass-out-${Date.now()}.mp3`)

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
                `ffmpeg -y -i "${input}" -af "bass=g=${gain}:f=100:w=0.6" "${output}"`,
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
            console.error("BASS ERROR:", e)
            sock.sendMessage(jid, { text: "❌ Failed to boost bass" })
        }
    }
}
