const { GoogleGenerativeAI } = require('@google/generative-ai')
const config = require('../config')

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

            const question = args.join(' ')
            const result = await model.generateContent(question)
            const reply = result.response.text()

            await sock.sendMessage(msg.key.remoteJid, {
                text: `🤖 *Gemini:*\n\n${reply}`
            })

        } catch (err) {
            console.error('GEMINI ERROR:', err)
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Gemini request failed.'
            })
        }
    }
}
