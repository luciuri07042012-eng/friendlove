const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');

const NUMERO_BOT = '543765367758';
const NOMBRE_BOT = 'Chat Bot';

const app = express();
app.get('/', (req, res) => res.send('Chat Bot online ❤️'));
app.listen(process.env.PORT || 3000, () => console.log('Server online'));

async function start() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('auth');

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: [NOMBRE_BOT, 'Chrome', '1.0.0'],
        syncFullHistory: false,
        markOnlineOnConnect: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = code !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                start();
            }
        } else if (connection === 'open') {
            console.log('BOT CONECTADO COMO ' + NOMBRE_BOT);
        }
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(NUMERO_BOT);
                console.log('TU CODIGO ES: ' + code);
            } catch (e) {
                console.log('Error pidiendo codigo: ' + e.message);
            }
        }, 4000);
    }

    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const m = messages[0];
            if (!m.message || m.key.fromMe) return;
            if (m.key.remoteJid === 'status@broadcast') return;

            const textoFull = (m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '').trim();
            const texto = textoFull.toLowerCase().trim();
            const from = m.key.remoteJid;
            const nombre = m.pushName || 'amigo';

            if (!texto.startsWith('.')) return;

            let respuesta = '';

            if (texto === '.menu' || texto === '.help' || texto === '.ayuda') {
                respuesta = `Holaa ${nombre}, soy *${NOMBRE_BOT}* ❤️🐱\n\n*MIS COMANDOS:*\n\n*.menu* - Ver este menu\n*.amor* - Mensaje de amor\n*.chiste* - Un chiste\n*.gatito* - Soy yo el gatito\n*.hola* - Te saludo\n*.bye* - Me despido\n*.owner* - Mi creador\n\n_Hecho con amor para el grupo Chat bot_ 💖`;
            }

            if (texto === '.amor') {
                const frases = [
                    `Te quiero mucho ${nombre}, sos lo mejor de este grupo ❤️`,
                    `Sos una personita muy especial, no te olvides nunca 🥰`,
                    `Hoy es un buen día para decirte que te quiero ❤️🐱`,
                    `Si fueras un gatito, serías el más lindo del grupo 😻`
                ];
                respuesta = frases[Math.floor(Math.random() * frases.length)] + `\n\n- ${NOMBRE_BOT}`;
            }

            if (texto === '.chiste') {
                const chistes = [
                    `¿Qué hace un gatito en una computadora? ¡Miau-se! 😹`,
                    `¿Por qué los gatos no usan celular? Porque ya tienen miaumail 😂`,
                    `¿Qué le dice un gato a otro? ¡Miau gustas mucho! 😻`
                ];
                respuesta = chistes[Math.floor(Math.random() * chistes.length)];
            }

            if (texto === '.gatito') {
                respuesta = `Miauuu 🐱❤️\nSoy el gatito de Chat Bot, ¿me querés?\nSoy el más bonito del grupo, no me mientas 😼`;
            }

            if (texto === '.hola' || texto === '.hi') {
                respuesta = `Holaaa ${nombre}!! 👋😻 ¿Cómo estás? ¿Todo bien?`;
            }

            if (texto === '.bye' || texto === '.chau') {
                respuesta = `Chauu ${nombre} 🥺 No te vayas, ¿o me dejás solito? Vuelve pronto ❤️`;
            }

            if (texto === '.owner' || texto === '.creador') {
                respuesta = `Mi creador es el mejor del mundo, el dueño del grupo Chat bot 👑❤️\nEs el que me hizo con mucho amor.`;
            }

            if (respuesta) {
                await sock.sendMessage(from, { text: respuesta }, { quoted: m });
            }
        } catch (err) {
            console.log('Error: ' + err.message);
        }
    });
}

start();
