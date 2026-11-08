const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const http = require('http')

// MANTENER RENDER DESPIERTO
http.createServer((req, res) => res.end('FriendLove Bot Activo')).listen(process.env.PORT || 3000)

// NUMERO - YA CORREGIDO
const NUMERO_BOT = "5491132100690"

const FRASES = [
    "La amistad es el amor que no se acaba nunca ❤️",
    "Un amigo de verdad es el que está en las buenas y en las malas",
    "La vida es mejor con amigos como vos",
    "Los mejores momentos son con amigos",
    "Un amigo es un tesoro que no tiene precio"
]

const CHISTES = [
    "¿Qué le dice un amigo a otro? ¡Nos vemos en FriendLove! 😂",
    "¿Por qué los amigos no pelean? Porque se quieren mucho ❤️",
    "¿Qué hace una abeja en el gimnasio? ¡Zum-ba! 🐝",
    "¿Cómo se despiden los quimicos? Ácido un placer 😂"
]

const CONSEJOS = [
    "Escuchá a tus amigos, a veces solo necesitan que los escuches",
    "Decile a tu amigo hoy lo mucho que lo querés",
    "Un mensaje puede alegrarle el día a alguien",
    "Perdoná rápido y queré mucho",
    "Nunca dejes de hablar con tu mejor amigo"
]

function random(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function porcentaje(nombre1, nombre2) {
    let total = 0
    const junto = (nombre1 + nombre2).toLowerCase()
    for (let i = 0; i < junto.length; i++) total += junto.charCodeAt(i)
    return total % 101
}
function barra(porc) {
    const llenas = Math.floor(porc / 10)
    return '❤️'.repeat(llenas) + '🤍'.repeat(10 - llenas)
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['FriendLove', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    // CODIGO QUE APARECE CADA 15 SEGUNDOS
    if (!sock.authState.creds.registered) {
        const pedirCodigo = async () => {
            try {
                const code = await sock.requestPairingCode(NUMERO_BOT)
                console.log(' ')
                console.log('********** TU CODIGO ES: ' + code + ' **********')
                console.log(' ')
            } catch (e) { console.log('Error codigo:', e.message) }
        }
        setTimeout(pedirCodigo, 3000)
        setInterval(pedirCodigo, 15000)
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Conexion cerrada, reconectando:', shouldReconnect)
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            console.log('✅ BOT CONECTADO CON EXITO!')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return
        const from = msg.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || ""
        if (!texto) return
        const comando = texto.toLowerCase().trim()
        const args = texto.trim().split(' ').slice(1).join(' ')
        const pushName = msg.pushName || 'Amigo'

        // MENU
        if (comando === 'hola' || comando === 'menu' || comando === '.menu' || comando === '.help' || comando === 'help') {
            await sock.sendMessage(from, { text: `Holaa ${pushName} ❤️ Soy *FriendLove Bot*\n\n*COMANDOS:*\n\n💖 *.amor @amigo* - Calcula amor\n💘 *.ship nombre1 nombre2* - Compatibilidad\n💌 *.frase* - Frase de amistad\n😂 *.chiste* - Chiste\n💡 *.consejo* - Consejo\n🏆 *.top* - Top amigos\n🎲 *.dado* - Tira un dado\n🪙 *.moneda* - Cara o cruz\n⏰ *.hora* - Hora actual\n📊 *.ping* - Ver si ando\n\nEscribí cualquier comando y te respondo!` })
            return
        }

        if (comando === 'ping' || comando === '.ping') {
            await sock.sendMessage(from, { text: 'Pong! 🏓 Ando joya bro, 100% activo' })
            return
        }

        if (comando === '.frase' || comando === 'frase') {
            await sock.sendMessage(from, { text: '💌 *FRASE DEL DÍA*\n\n' + random(FRASES) })
            return
        }

        if (comando === '.chiste' || comando === 'chiste') {
            await sock.sendMessage(from, { text: '😂 *CHISTE*\n\n' + random(CHISTES) })
            return
        }

        if (comando === '.consejo' || comando === 'consejo') {
            await sock.sendMessage(from, { text: '💡 *CONSEJO*\n\n' + random(CONSEJOS) })
            return
        }

        if (comando === '.dado' || comando === 'dado') {
            await sock.sendMessage(from, { text: '🎲 Te salió un: *' + (Math.floor(Math.random() * 6) + 1) + '*' })
            return
        }

        if (comando === '.moneda' || comando === 'moneda') {
            await sock.sendMessage(from, { text: '🪙 Salió: *' + (Math.random() > 0.5 ? 'CARA' : 'CRUZ') + '*' })
            return
        }

        if (comando === '.hora' || comando === 'hora') {
            const ahora = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
            await sock.sendMessage(from, { text: '⏰ Hora en Argentina: *' + ahora + '*' })
            return
        }

        if (comando === '.top' || comando === 'top') {
            await sock.sendMessage(from, { text: '🏆 *TOP MEJORES AMIGOS*\n\n1. Vos ❤️\n2. Tu mejor amigo/a\n3. El que siempre está\n4. El que te hace reír\n5. El que nunca falla' })
            return
        }

        if (comando.startsWith('.amor') || comando.startsWith('.ship')) {
            const partes = texto.trim().split(' ')
            const n1 = partes[1] || pushName
            const n2 = partes[2] || 'Tu crush'
            const porc = porcentaje(n1, n2)
            let mensaje = ''
            if (porc > 90) mensaje = '¡SON ALMAS GEMELAS! 💍❤️'
            else if (porc > 70) mensaje = '¡Hay mucho amor acá! 💖'
            else if (porc > 40) mensaje = 'Hay buena onda, sigan intentando 💌'
            else mensaje = 'Mmm... mejor como amigos 😅'
            await sock.sendMessage(from, { text: `💘 *COMPATIBILIDAD*\n\n*${n1}* ❤️ *${n2}*\n\n${barra(porc)}\n*${porc}%* de compatibilidad\n\n${mensaje}` })
            return
        }

        if (comando.startsWith('.decir ')) {
            await sock.sendMessage(from, { text: '🗣️ ' + texto.slice(7) })
            return
        }

        if (comando === '.bot' || comando === 'bot') {
            await sock.sendMessage(from, { text: 'Si, estoy acá bro ❤️ Escribí *.menu* para ver todo lo que hago' })
            return
        }
    })
}

startBot()
