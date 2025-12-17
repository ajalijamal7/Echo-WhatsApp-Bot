const { ownerOnly } = require("./restart")

module.exports = {
    name: 'tagadmins',
    description: 'Tag all group admins',
    groupOnly: true,
    ownerOnly: true,

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid

        try {

            const metadata = await sock.groupMetadata(jid)


            const admins = metadata.participants.filter(
                p => p.admin === 'admin' || p.admin === 'superadmin'
            )

            if (admins.length === 0) {
                return sock.sendMessage(jid, {
                    text: '❌ No admins found in this group.'
                })
            }


            const mentions = admins.map(a => a.id)


            const mentionText = mentions
                .map(id => `@${id.split('@')[0]}`)
                .join(' ')


            const text =
                args.length > 0
                    ? `${args.join(' ')}\n\n${mentionText}`
                    : `📢 Admins\n\n${mentionText}`

            
            await sock.sendMessage(jid, {
                text,
                mentions
            })

        } catch (err) {
            console.error('TAGADMINS ERROR:', err)
            await sock.sendMessage(jid, {
                text: '❌ Failed to tag admins.'
            })
        }
    }
}
