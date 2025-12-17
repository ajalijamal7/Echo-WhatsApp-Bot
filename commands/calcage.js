module.exports = {
    name: 'calcage',
    description: 'Calculate age in years, minutes, and seconds',

    run: async ({ sock, msg, args }) => {
        if (!args[0]) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Usage: .calcage YYYY-MM-DD\nExample: .calcage 2003-05-12'
            })
        }

        const birthDate = new Date(args[0])
        if (isNaN(birthDate.getTime())) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Invalid date format.\nUse YYYY-MM-DD'
            })
        }

        const now = new Date()

        if (birthDate > now) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Birth date cannot be in the future.'
            })
        }

        const diffMs = now - birthDate

        const seconds = Math.floor(diffMs / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        const years = Math.floor(days / 365.25)

        const reply =
            `🎂 *Age Calculation*

📅 Birth date: ${args[0]}

🧓 Years: ${years}
⏱️ Minutes: ${minutes.toLocaleString()}
⏳ Seconds: ${seconds.toLocaleString()}`

        await sock.sendMessage(msg.key.remoteJid, {
            text: reply
        })
    }
}
