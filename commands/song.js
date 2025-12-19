const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const YTDLP = resolveBinary('yt-dlp.exe', 'yt-dlp')
const FFMPEG = resolveBinary('ffmpeg.exe', 'ffmpeg')

function resolveBinary(winName, unixName) {
    const local = path.join(__dirname, '..', 'bin', winName)
    if (process.platform === 'win32' && fs.existsSync(local)) {
        return local
    }
    return unixName
}

module.exports = {
    name: 'song',
    description: 'Search and download a song as MP3',

    run: async ({ sock, msg, args }) => {
        if (!args.length) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Usage: .song <song name>'
            })
        }

        const query = args.join(' ')
        const baseName = `song_${Date.now()}`
        const tmpDir = path.join(__dirname, '../tmp')
        const outputTemplate = path.join(tmpDir, `${baseName}.%(ext)s`)

        fs.mkdirSync(tmpDir, { recursive: true })


        await sock.sendMessage(msg.key.remoteJid, {
            text: '🎵 Searching and downloading...'
        })

        const cmd =
            `"${YTDLP}" -x --audio-format mp3 ` +
            `--ffmpeg-location "${FFMPEG}" ` +
            `--audio-quality 0 ` +
            `--no-playlist ` +
            `--default-search ytsearch1 ` +
            `-o "${outputTemplate}" ` +
            `"${query}"`







        exec(cmd, {
            windowsHide: true,
            shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
            timeout: 1000 * 60 * 3,
            maxBuffer: 1024 * 1024 * 20
        }, async (err, stdout, stderr) => {


            console.log('YT-DLP STDOUT:\n', stdout)
            console.log('YT-DLP STDERR:\n', stderr)

            if (err) {
                console.error('SONG ERROR:', err)
                return sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Failed to download song.'
                })
            }

            const files = fs.readdirSync(tmpDir)
            const mp3File = files.find(
                f => f.startsWith(baseName) && f.endsWith('.mp3')
            )

            if (!mp3File) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ MP3 file not generated.'
                })
            }

            const fullPath = path.join(tmpDir, mp3File)

            try {
                await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        audio: { url: fullPath },
                        mimetype: 'audio/mpeg'
                    },
                    { quoted: msg }
                )
            } catch (sendErr) {
                console.error('SEND AUDIO ERROR:', sendErr)
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Failed to send audio.'
                })
            } finally {

                try {
                    fs.unlinkSync(fullPath)
                } catch (cleanupErr) {
                }
            }
        })

    }
}
