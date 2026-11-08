          const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const http = require('http')
const pino = require('pino')

http.createServer((req, res) => res.end('FriendLove Bot Online 💖')).listen(process.env.PORT || 3000)

const NUMERO_BOT = '5491132100690'
const PREFIX = '!'

const consejos = [
    "Si te gusta, decíselo. El 'qué hubiera pasado' duele más que un no.",
    "No stalkees tanto, te hace mal. Si te quiere, te busca.",
    "Si te deja en visto y siempre es vos el que habla, ahí no es.",
    "Amor propio primero: si no te valoran, no ruegues.",
    "Si te da nervios hablarle, es porque te importa. Mandale igual.",
    "No te compares con su ex, vos sos otra historia.",
    "Si te responde rápido y con ganas, hay interés. Si te responde seco, soltá.",
    "Un clavo no saca otro clavo, pero un buen meme ayuda."
]
const chistes = [
    "¿Qué le dice un 0 a un 8? Bonito cinturón 😂",
    "¿Por qué los pájaros no usan Facebook? Porque ya tienen Twitter 🐦",
    "¿Qué hace una abeja en el gimnasio? Zumba 🐝",
    "Mi crush me dejó en visto... así que ahora soy experto en ver visto.",
    "¿Eres WiFi? Porque siento la conexión 💘"
]
const frases = [
    "El amor no se busca, se encuentra cuando menos lo esperás.",
    "Quien te quiere de verdad, te busca sin excusas.",
    "Si es para vos, ni aunque te quites. Si no es, ni aunque te pongas.",
    "A veces el 'casi algo' duele más que el 'nunca fue'."
]
const horoscopos = {
    aries: "Hoy alguien te va a mirar distinto. Estate atento.",
    tauro: "No te aferres a quien ya se fue. Viene algo mejor.",
    geminis: "Tenés dos personas en la cabeza. Elegí con el corazón, no con ansiedad.",
    cancer: "Te van a escribir. No respondas en caliente.",
    leo: "Hoy brillás. Aprovechá para hablarle a tu crush.",
    virgo: "Dejá de sobrepensar. Mandale ese mensaje.",
    libra: "Se viene una decisión amorosa. Escuchate a vos.",
    escorpio: "Intenso como siempre. No asustes a tu crush, andá tranqui.",
    sagitario: "Alguien te extraña más de lo que dice.",
    capricornio: "El amor te va a encontrar trabajando, tranqui.",
    acuario: "Esa persona rara que te gusta, también piensa en vos.",
    piscis: "Soñaste con alguien? No fue casualidad."
}

function random(arr){ return arr[Math.floor(Math.random()*arr.length)] }
function porcentaje(nombre1, nombre2){
    let total = 0
    const s = (nombre1+nombre2).toLowerCase()
    for(let c of s) total += c.charCodeAt(0)
    return (total % 101)
}
function barra(p){
    const llenos = Math.round(p/10)
    return '❤️'.repeat(llenos) + '🤍'.repeat(10-llenos)
}

async function start(){
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['FriendLove', 'Chrome', '1.0'],
        syncFullHistory: false
    })
    sock.ev.on('creds.update', saveCreds)

    if(!sock.authState.creds.registered){
        setTimeout(async () => {
            try{
                const code = await sock.requestPairingCode(NUMERO_BOT)
                console.log('====================================')
                console.log('CODIGO DE VINCULACION: ' + code)
                console.log('====================================')
            }catch(e){ console.log('Error codigo:', e.message) }
        }, 3000)
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close'){
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.statusCode !== DisconnectReason.loggedOut
            console.log('Desconectado, reconectando...', shouldReconnect)
            if(shouldReconnect) start()
        } else if(connection === 'open'){
            console.log('BOT CONECTADO! FriendLove Online 💖')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        try{
            const msg = messages[0]
            if(!msg.message || msg.key.fromMe) return
            const from = msg.key.remoteJid
            const isGroup = from.endsWith('@g.us')
            const sender = msg.key.participant || from
            const nombre = msg.pushName || 'Amig@'
            const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || ''
            if(!texto.startsWith(PREFIX) && texto.toLowerCase() !== 'hola') return

            const args = texto.trim().slice(1).trim().split(/ +/)
            const cmd = (texto.toLowerCase() === 'hola' ? 'hola' : args.shift().toLowerCase())
            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []
            const q = args.join(' ')

            const reply = (t) => sock.sendMessage(from, { text: t }, { quoted: msg })

            // ============ COMANDOS ============
            if(cmd === 'menu' || cmd === 'help' || cmd === 'ayuda'){
                return reply(`💖 *FRIENDLOVE - MENU* 💖

*AMOR:*
!ship @persona1 @persona2 - Compatibilidad entre 2
!amor @persona - Cuanto te ama
!compatibilidad @persona - % con esa persona
!consejo - Consejo amoroso
!frase - Frase de amor
!horoscopo [signo] - Tu horoscopo amoroso

*DIVERSIÓN:*
!chiste - Chiste
!pregunta + tu pregunta - Te responde Si/No
!8ball + pregunta - Bola mágica
!dado - Tira un dado
!moneda - Cara o cruz
!top - Top de amigos del grupo

*UTILES:*
!sticker - Respondé a una foto con !sticker
!ping - Ve si estoy vivo
!info - Info del bot
!hola - Saludo

Ejemplo: *!ship @juan @maria*`)
            }
            if(cmd === 'hola') return reply(`Hola ${nombre}! 💖 Soy FriendLove. Escribí *!menu* para ver todo lo que hago.`)
            if(cmd === 'ping') return reply('Pong! 🏓 Estoy vivo y online 💖')
            if(cmd === 'info') return reply('💖 *FriendLove Bot*\nHecho para joder, shippear y aconsejar.\nUsá !menu para ver comandos.\nDueño: +54 9 11 3210-0690')
            if(cmd === 'consejo') return reply('💌 *Consejo:* \n' + random(consejos))
            if(cmd === 'chiste') return reply('😂 ' + random(chistes))
            if(cmd === 'frase') return reply('💖 ' + random(frases))
            if(cmd === 'dado') return reply(`🎲 Tiraste el dado y salió: *${Math.floor(Math.random()*6)+1}*`)
            if(cmd === 'moneda') return reply(`🪙 Salió: *${Math.random() > 0.5 ? 'CARA' : 'CRUZ'}*`)
            if(cmd === 'pregunta' || cmd === '8ball'){
                if(!q) return reply('Haceme una pregunta, ej: *!pregunta me quiere?*')
                const r = ['Si, obvio 💖','No, ni ahí ❌','Puede ser... 🤔','100% que si','Mmm, mejor no saber','Preguntale vos, dale','Si, pero con miedo','No, soltá eso']
                return reply(`❓ *Pregunta:* ${q}\n💬 *Respuesta:* ${random(r)}`)
            }
            if(cmd === 'horoscopo'){
                const signo = q.toLowerCase()
                if(!horoscopos[signo]) return reply('Poné tu signo, ej: *!horoscopo leo*\nSignos: aries, tauro, geminis, cancer, leo, virgo, libra, escorpio, sagitario, capricornio, acuario, piscis')
                return reply(`🔮 *Horóscopo ${signo.toUpperCase()}*\n${horoscopos[signo]}`)
            }
            if(cmd === 'ship'){
                if(mentioned.length < 2) return reply('Mencioná a 2 personas, ej: *!ship @juan @maria*')
                const p = porcentaje(mentioned[0], mentioned[1])
                return reply(`💘 *SHIP* 💘\n\n@${mentioned[0].split('@')[0]} ❤️ @${mentioned[1].split('@')[0]}\n\nCompatibilidad: *${p}%*\n${barra(p)}\n\n${p > 80 ? 'SON EL UNO PARA EL OTRO, CASENSE 💍' : p > 50 ? 'Hay química, dale para adelante 👀' : p > 30 ? 'Mmm, como amigos mejor...' : 'Ahí no es, soltá 🤡'}`, { mentions: mentioned })
            }
            if(cmd === 'amor' || cmd === 'compatibilidad'){
                if(mentioned.length < 1) return reply('Mencioná a alguien, ej: *!amor @maria*')
                const p = porcentaje(sender, mentioned[0])
                return reply(`💖 *${nombre} + @${mentioned[0].split('@')[0]}*\n\nAmor: *${p}%*\n${barra(p)}\n\n${p > 80 ? 'SE AMAN FUERTE 💖' : p > 50 ? 'Hay algo ahí 👀' : 'Mejor como amigos...'}`, { mentions: [mentioned[0]] })
            }
            if(cmd === 'top'){
                if(!isGroup) return reply('Este comando solo funciona en grupos!')
                return reply(`🏆 *TOP AMIGOS DEL GRUPO*\n\n1. ${nombre} - El más fiel 💖\n2. El que siempre responde\n3. El que deja en visto\n4. El chismoso\n5. El que nunca sale\n\n(Este top es 100% real, no fake)`)
            }
            if(cmd === 'sticker'){
                const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
                const imgMsg = quoted?.imageMessage || msg.message.imageMessage
                if(!imgMsg) return reply('Respondé a una foto con *!sticker* o mandame una foto con el caption *!sticker*')
                try{
                    const stream = await downloadContentFromMessage(imgMsg, 'image')
                    let buffer = Buffer.from([])
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
                    await sock.sendMessage(from, { sticker: buffer }, { quoted: msg })
                }catch(e){ return reply('No pude hacer el sticker, probá con otra foto 😢') }
                return
            }

        }catch(e){ console.log('Error en mensaje:', e.message) }
    })
}
start()                                                                                              
