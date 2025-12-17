module.exports = {
  name: 'say',
  description: 'Says what you want him to say like a good slave',

  run: async ({ sock, msg, args }) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Usage: .say <message>'
      })
    }

    const message = args.join(' ')

    await sock.sendMessage(msg.key.remoteJid, {
      text: message
    })
  }
}
