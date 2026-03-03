process.on('unhandledRejection', err => {
    console.error('UNHANDLED REJECTION:', err)
})

process.on('uncaughtException', err => {
    console.error('UNCAUGHT EXCEPTION:', err)
})

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const qrcode = require('qrcode-terminal')
const handleMessage = require('./handlers/handleMessage')
const statusStore = require('./helper_commands/statusStore')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')

    // 🔥 Fetch latest WhatsApp Web version (IMPORTANT FIX)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log('\n📱 Scan this QR code:\n')
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'open') {
            console.log('✅ WhatsApp connected successfully')
        }

        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== 401

            console.log('❌ Connection closed. Reconnecting:', shouldReconnect)

            if (shouldReconnect) {
                startBot()
            }
        }
    })

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return

        const msg = messages[0]
        if (!msg.message) return

        // Live story listener
        for (const m of messages) {
            if (m.key?.remoteJid === 'status@broadcast') {
                console.log('📥 New story received from:', m.key.participant)
                statusStore.addStatus(m)
            }
        }

        // Pass to your regular message handler
        if (typeof handleMessage === 'function') {
            await handleMessage(sock, msg)
        } else {
            console.error('handleMessage is not a function — handler not loaded')
        }
    })
}

startBot()