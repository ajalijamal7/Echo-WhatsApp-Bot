const { downloadContentFromMessage } = require("@whiskeysockets/baileys")
const sharp = require("sharp")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

module.exports = {
    name: "resize",
    description: "Resize an image",

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

        if (!quoted?.imageMessage) {
            return sock.sendMessage(jid, {
                text: "❌ Reply to an image with `.resize <w> <h>`"
            })
        }

        const width = parseInt(args[0])
        const height = parseInt(args[1])

        if (!width || !height) {
            return sock.sendMessage(jid, {
                text: "❌ Usage: `.resize <width> <height>`\nExample: `.resize 512 512`"
            })
        }

        const tempDir = path.join(__dirname, "../temp")
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

        const id = crypto.randomBytes(5).toString("hex")
        const input = path.join(tempDir, `resize-in-${id}.jpg`)
        const output = path.join(tempDir, `resize-out-${id}.jpg`)

        try {
            const stream = await downloadContentFromMessage(quoted.imageMessage, "image")
            let buffer = Buffer.from([])

            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk])
            }

            fs.writeFileSync(input, buffer)

            await sharp(input)
                .resize(width, height, { fit: "inside" })
                .toFile(output)

            await sock.sendMessage(jid, {
                image: fs.readFileSync(output)
            })

        } catch (e) {
            console.error("RESIZE ERROR:", e)
            sock.sendMessage(jid, { text: "❌ Failed to resize image" })
        } finally {
            if (fs.existsSync(input)) fs.unlinkSync(input)
            if (fs.existsSync(output)) fs.unlinkSync(output)
        }
    }
}
