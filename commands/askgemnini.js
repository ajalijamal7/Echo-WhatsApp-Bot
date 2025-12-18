const { GoogleGenerativeAI } = require('@google/generative-ai')
const config = require('../config')

const personaPrompt = `
You are Echo, a smart, concise, and friendly WhatsApp assistant.
Be clear, calm, and helpful.
Avoid unnecessary verbosity.
`

module.exports = {
    name: 'askgemini',
    description: 'Ask Google Gemini a question',

    run: async ({ sock, msg, args }) => {
        if (!args.length) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Usage: .askgemini <question>'
            })
        }

        if (!config.geminiApiKey) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Gemini API key missing'
            })
        }

        try {
            const genAI = new GoogleGenerativeAI(config.geminiApiKey)

            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash'
            })

            const userQuestion = args.join(' ')

            const fullPrompt = `
${personaPrompt}

User question:
${userQuestion}
`

            const result = await model.generateContent(fullPrompt)
            const reply = result.response.text()

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🤖 *Echo:*\n\n${reply}`
            })

        } catch (err) {
            console.error('GEMINI ERROR:', err)
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Gemini request failed.'
            })
        }
    }
}
