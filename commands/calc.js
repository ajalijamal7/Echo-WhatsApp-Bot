const axios = require("axios")
const fs = require("fs")
const path = require("path")
const FormData = require("form-data")
const { REMOVE_BG_API_KEY } = require("../config")
const { downloadContentFromMessage } = require("@whiskeysockets/baileys")


module.exports = {
  name: "background",
  description: "Remove background from an image",

  run: async ({ sock, msg }) => {
    const jid = msg.key.remoteJid

    if (!REMOVE_BG_API_KEY) {
      return sock.sendMessage(jid, {
        text: "❌ Background service is not configured."
      })
    }

    const quoted =
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

    if (!quoted || !quoted.imageMessage) {
      return sock.sendMessage(jid, {
        text: "❌ Reply to an image with `.background`"
      })
    }

    const tempDir = path.join(__dirname, "../temp")
    const inputPath = path.join(tempDir, "input.png")
    const outputPath = path.join(tempDir, "output.png")


    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir)
    }

    try {

      const stream = await downloadContentFromMessage(
        quoted.imageMessage,
        "image"
      )


      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      fs.writeFileSync(inputPath, buffer)


      const formData = new FormData()
      formData.append("image_file", fs.createReadStream(inputPath))
      formData.append("size", "auto")

      const response = await axios.post(
        "https://api.remove.bg/v1.0/removebg",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            "X-Api-Key": REMOVE_BG_API_KEY
          },
          responseType: "arraybuffer"
        }
      )

      fs.writeFileSync(outputPath, response.data)


      await sock.sendMessage(jid, {
        image: fs.readFileSync(outputPath),
        caption: "✅ Background removed"
      })

    } catch (err) {
      console.error("Background command error:", err.response?.data || err)

      await sock.sendMessage(jid, {
        text: "❌ Failed to remove background."
      })
    } finally {

      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    }
  }
}
