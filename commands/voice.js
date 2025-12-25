const { downloadMediaMessage } = require('@whiskeysockets/baileys')

module.exports = {
  name: 'voice',
  description: 'Resend a replied one time voice message as a normal voice message',

  run: async ({ sock, msg }) => {
    const ctx = msg.message?.extendedTextMessage?.contextInfo

    if (!ctx?.quotedMessage?.audioMessage) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Reply to a voice message message with `.voice`'
      })
    }

    const mediaMsg = {
      key: {
        remoteJid: msg.key.remoteJid,
        fromMe: false,
        id: ctx.stanzaId,
        participant: ctx.participant
      },
      message: ctx.quotedMessage
    }

    try {
      const audioBuffer = await downloadMediaMessage(
        mediaMsg,
        'buffer',
        {},
        {
          logger: sock.logger,
          reuploadRequest: sock.updateMediaMessage
        }
      )

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          audio: audioBuffer,
          ptt: true,
          mimetype: 'audio/ogg; codecs=opus'
        },
        { quoted: msg }
      )

    } catch (err) {
      console.error('VOICE ERROR:', err)
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Failed to send voice message'
      })
    }
  }
}
