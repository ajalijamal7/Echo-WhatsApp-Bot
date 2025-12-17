const { ownerOnly } = require("./restart")

module.exports = {
    name: 'tagall',
    description: 'Tag all members in the group',
    groupOnly: true,
    ownerOnly: true,

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid

        try {
            const metadata = await sock.groupMetadata(jid)
            const participants = metadata.participants


            const mentions = participants.map(p => p.id)

            const mentionText = mentions
                .map(id => `@${id.split('@')[0]}`)
                .join(' ')


            const text =
                args.length > 0
                    ? `${args.join(' ')}\n\n${mentionText}`
                    : `📢 Attention everyone\n\n${mentionText}`


            await sock.sendMessage(jid, {
                text,
                mentions
            })

        } catch (err) {
            console.error('TAGALL ERROR:', err)
            await sock.sendMessage(jid, {
                text: '❌ Failed to tag all members.'
            })
        }
    }
}
