const { botName } = require('../helper_commands/settings')

module.exports = {
  name: 'ping',
  description: 'Check if the bot is alive',
  ignoreGlobal: true,

  run: async ({ sock, msg }) => {
    await sock.sendMessage(msg.key.remoteJid, {
      text: `🏓 Pong!\n\n🤖 ${botName} is online`
    })
  }
}
