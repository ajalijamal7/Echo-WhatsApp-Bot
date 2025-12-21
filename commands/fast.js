
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

module.exports = {
    name: "fast",
    description: "Speed up audio",

    run: async ({ sock, msg }) => {
        const jid = msg.key.remoteJid
        const ctx = msg.message?.extendedTextMessage?.contextInfo
        if (!ctx?.quotedMessage?.audioMessage) {
            return sock.sendMessage(jid, { text: "❌ Reply to an audio with `.fast`" })
        }

        const tempDir = path.join(__dirname, "../temp")
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

        const id = crypto.randomBytes(5).toString("hex")
        const input = path.join(tempDir, `fast-in-${id}.mp3`)
        const output = path.join(tempDir, `fast-out-${id}.mp3`)

        const mediaMsg = {
            key: { remoteJid: jid, fromMe: false, id: ctx.stanzaId, participant: ctx.participant },
            message: ctx.quotedMessage
        }

        try {
            const buffer = await downloadMediaMessage(mediaMsg, "buffer", {}, {
                logger: sock.logger,
                reuploadRequest: sock.updateMediaMessage
            })

            fs.writeFileSync(input, buffer)

            exec(`ffmpeg -y -i "${input}" -filter:a "atempo=1.4" "${output}"`, async (err) => {
                if (err) throw err
                await sock.sendMessage(jid, { audio: fs.readFileSync(output), mimetype: "audio/mpeg" })
                fs.unlinkSync(input)
                fs.unlinkSync(output)
            })

        } catch (e) {
            console.error("FAST ERROR:", e)
            sock.sendMessage(jid, { text: "❌ Failed to speed audio" })
        }
    }
}
