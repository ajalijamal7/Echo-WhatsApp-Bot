const fs = require('fs')
const path = require('path')
const { prefix, botName } = require('../helper_commands/settings')

module.exports = {
    name: 'help',
    description: 'Show all available commands',
    ignoreGlobal:true,

    run: async ({ sock, msg }) => {
        const commandsPath = path.join(__dirname)
        const files = fs.readdirSync(commandsPath)

        let text = `✨ *${botName} Help Menu*\n`
        text += `━━━━━━━━━━━━━━━\n`
        text += `👋 Hi! I’m *${botName}*, here to help you.\n\n`
        text += `📌 *Commands:*\n\n`

        for (const file of files) {
            const command = require(`./${file}`)
            if (!command.name) continue

            text += `🔹 *${prefix}${command.name}*`
            if (command.description) {
                text += `\n   _${command.description}_`
            }
            text += `\n\n`
        }

        text += `━━━━━━━━━━━━━━━\n`
        text += `⚙️ Prefix: \`${prefix}\`\n`
        text += `🤖 Bot: *${botName}*\n`
        text += `🚀 Built with ❤️ using Node.js\n`
        text += `Owners: Ali - Jamal & Bahaa El Rawass`


        await sock.sendMessage(
            msg.key.remoteJid,
            {
                image: fs.readFileSync(
                    path.join(__dirname, '../assets/bot.png')
                ),
                caption: text
            }
        )
    }
}
