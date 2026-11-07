const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
async function start(){
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({ auth: state, logger: pino({level:"silent"}) });
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", (u)=>{
    if(u.connection==="open") console.log("✅ BOT CONECTADO");
    if(u.connection==="close") start();
  });
  sock.ev.on("messages.upsert", async ({messages})=>{
    const m = messages[0]; if(!m.message || m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
    if(!text.startsWith("#")) return;
    const jid = m.key.remoteJid;
    const reply = (t)=> sock.sendMessage(jid, {text:t}, {quoted:m});
    if(text==="#bal") return reply("💰 BALANCE\nDinero: 0 ovio coins\nBanco: 0\nTotal: 0");
    if(text==="#rw") return reply("🎴 Personaje: Gojo\nValor: 120.000 ovio coins\nDueño: Libre ✅");
    if(text==="#tienda") return reply("🛒 TIENDA HOY:\n- Goku - 50.000\n- Gojo - 120.000");
    if(text==="#help") return reply("💖 FRIEND LOVE BOT\n#bal #rw #tienda #daily #w #help");
    if(text==="#daily") return reply("🎁 Daily: +35.000 ovio coins");
    if(text==="#w") return reply("💼 Trabajaste y ganaste 3.500 ovio coins");
  });
}
start();
