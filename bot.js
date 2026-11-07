const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");

let DB = {};
if(fs.existsSync("./data.json")){ try{ DB = JSON.parse(fs.readFileSync("./data.json")); }catch(e){ DB={} } }
if(!DB.users) DB.users = {};
if(!DB.config) DB.config = { moneda: "ovio coin", tienda: [], tiendaDia: "", ventas: [], intercambios: {}, cerrados: [] };
function save(){ fs.writeFileSync("./data.json", JSON.stringify(DB)); }
function user(id){
  if(!DB.users[id]) DB.users[id] = { coins: 0, banco: 0, racha: 0, lastDaily: 0, lastWork: 0, lastCrime: 0, lastSlut: 0, lastRw: 0, lastClaim: 0, lastVote: 0, lastRobar: 0, casado: null, cumple: "", personajes: [], ultimoPersonaje: null, };
  return DB.users[id];
}
function nombre(id){ return "@" + id.split("@")[0]; }
function moneda(){ return DB.config.moneda; }
function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function fmt(ms){ if(ms<=0) return "Libre ✅"; let s=Math.floor(ms/1000); let h=Math.floor(s/3600); let m=Math.floor((s%3600)/60); if(h>0) return h+" hrs "+m+" min"; return m+" min"; }

const PERSONAJES = ["Goku","Naruto","Gojo","Frieren","Anya","Levi","Sukuna","Eren","Tanjiro","Makima","Luffy","Zoro","Nezuko","Itachi","Sasuke","Hinata","Denji","Power","Kakashi","Mikey","Yuji","Megumi","Nobara","Killua","Gon","Asta","Yuno","Deku","Bakugo","Uraraka","Ichigo","Rukia","Saitama","Genos","Mob","Reigen","Spike","Faye","Violet","Shinji","Asuka","Rei","Kaguya","Miyuki","Chika","Aqua","Ruby","Kana","Hitori","Nijika","Ryo","Kita","Maomao","Jinshi","Sunraku","Arthur","Tessia","Solo","Jinwoo","Cha","Yoo"];
function tiendaHoy(){
  let hoy = new Date().toDateString();
  if(DB.config.tiendaDia !== hoy){
    let copia=[...PERSONAJES].sort(()=>Math.random()-0.5);
    DB.config.tienda = copia.slice(0,5).map(n=>({nombre:n, precio: rand(20000,80000)}));
    DB.config.tiendaDia = hoy; save();
  }
  return DB.config.tienda;
}
const GESTOS_SOLO = {
  happy:["😊","está feliz"], cry:["😭","está llorando"], dance:["💃","está bailando solo"], sleep:["😴","se fue a dormir"], angry:["😡","está enojado"], laugh:["😂","se está riendo"], blush:["😳","está sonrojado"], shy:["🫣","está tímido"], bored:["🥱","está aburrido"], think:["🤔","está pensando"]
};
const GESTOS_DUO = {
  hug:["🤗","abraza fuertemente a"], kiss:["😘","le da un beso a"], pat:["🐱","le hace pat pat a"], slap:["👋","le da una cachetada a"], bite:["😬","muerde a"], poke:["👉","pincha a"], cuddle:["🥰","se acurruca con"], handhold:["🤝","agarra de la mano a"], highfive:["✋","choca los cinco con"], wave:["👋","saluda a"], stare:["👀","mira fijo a"], smack:["💥","le da un golpe en la cabeza a"], tickle:["🤣","le hace cosquillas a"], punch:["🥊","le da un puñetazo de broma a"], kick:["🦶","le da una patada de broma a"], feed:["🍔","le da de comer a"], comfort:["🫂","consuela a"], carry:["🏋️","carga a"], propose:["💍","le propone casamiento a"], dance2:["💃","baila con"]
};

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({ auth: state, logger: pino({level:"silent"}), printQRInTerminal: true });
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", (u)=>{
    if(u.connection==="open") console.log("✅ BOT CONECTADO - Friend Love Community");
    if(u.connection==="close") start();
  });

  sock.ev.on("messages.upsert", async ({messages})=>{
    const m = messages[0]; if(!m.message || m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
    if(!text.startsWith("#")) return;
    const jid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const isGroup = jid.endsWith("@g.us");
    const u = user(sender);
    const args = text.trim().split(" ");
    const cmd = args[0].toLowerCase();
    const reply = (t)=> sock.sendMessage(jid, {text:t}, {quoted:m});
    const react = (e)=> sock.sendMessage(jid, {react:{text:e, key:m.key}});
    const getMention = ()=> m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (args[1]?.includes("@") ? args[1].replace("@","")+"@s.whatsapp.net" : null);
    const isAdmin = async ()=>{
      if(!isGroup) return false;
      try{ const meta = await sock.groupMetadata(jid); const p = meta.participants.find(x=>x.id===sender); return p?.admin==="admin"||
