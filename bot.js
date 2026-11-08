const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
let DB = {};
if(fs.existsSync("./data.json")){ try{ DB = JSON.parse(fs.readFileSync("./data.json")); }catch(e){ DB={} } }
if(!DB.users) DB.users = {};
if(!DB.config) DB.config = { moneda: "ovio coin", tienda: [], tiendaDia: "", ventas: [], intercambios: {} };
function save(){ fs.writeFileSync("./data.json", JSON.stringify(DB)); }
function user(id){
  if(!DB.users[id]) DB.users[id] = { coins: 0, banco: 0, racha: 0, lastDaily: 0, lastWork: 0, lastCrime: 0, lastSlut: 0, lastRw: 0, lastClaim: 0, lastVote: 0, lastRobar: 0, casado: null, cumple: "", personajes: [], ultimoPersonaje: null };
  return DB.users[id];
}
function nombre(id){ return "@" + id.split("@")[0]; }
function moneda(){ return DB.config.moneda; }
function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function fmt(ms){ if(ms<=0) return "Libre ✅"; let s=Math.floor(ms/1000); let h=Math.floor(s/3600); let m=Math.floor((s%3600)/60); if(h>0) return h+" hrs "+m+" min"; return m+" min"; }
const PERSONAJES = ["Goku","Naruto","Gojo","Frieren","Anya","Levi","Sukuna","Eren","Tanjiro","Makima","Luffy","Zoro","Nezuko","Itachi","Sasuke","Hinata","Denji","Power","Kakashi","Mikey","Yuji","Megumi","Nobara","Killua","Gon","Asta","Yuno","Deku","Bakugo","Uraraka","Ichigo","Rukia","Saitama","Genos","Mob","Reigen","Spike","Faye","Violet","Shinji","Asuka","Rei","Kaguya","Miyuki","Chika","Aqua","Ruby","Kana","Hitori","Nijika","Ryo","Kita","Maomao","Jinshi","Sunraku","Arthur","Tessia","Jinwoo","Cha","Yoo"];
function tiendaHoy(){
  let hoy = new Date().toDateString();
  if(DB.config.tiendaDia !== hoy){
    let copia=[...PERSONAJES].sort(()=>Math.random()-0.5);
    DB.config.tienda = copia.slice(0,5).map(n=>({nombre:n, precio: rand(20000,80000)}));
    DB.config.tiendaDia = hoy; save();
  }
  return DB.config.tienda;
}
const GESTOS_SOLO = { happy:["😊","está feliz"], cry:["😭","está llorando"], dance:["💃","está bailando solo"], sleep:["😴","se fue a dormir"], angry:["😡","está enojado"], laugh:["😂","se está riendo"], blush:["😳","está sonrojado"], shy:["🫣","está tímido"], bored:["🥱","está aburrido"], think:["🤔","está pensando"] };
const GESTOS_DUO = { hug:["🤗","abraza fuertemente a"], kiss:["😘","le da un beso a"], pat:["🐱","le hace pat pat a"], slap:["👋","le da una cachetada a"], bite:["😬","muerde a"], poke:["👉","pincha a"], cuddle:["🥰","se acurruca con"], handhold:["🤝","agarra de la mano a"], highfive:["✋","choca los cinco con"], wave:["👋","saluda a"], stare:["👀","mira fijo a"], smack:["💥","le da un golpe en la cabeza a"], tickle:["🤣","le hace cosquillas a"], punch:["🥊","le da un puñetazo de broma a"], kick:["🦶","le da una patada de broma a"], feed:["🍔","le da de comer a"], comfort:["🫂","consuela a"], carry:["🏋️","carga a"], propose:["💍","le propone casamiento a"] };
async function start(){
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({ auth: state, logger: pino({level:"silent"}), printQRInTerminal: true });
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", (u)=>{ if(u.connection==="open") console.log("✅ BOT CONECTADO"); if(u.connection==="close") start(); });
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
    const isAdmin = async ()=>{ if(!isGroup) return false; try{ const meta = await sock.groupMetadata(jid); const p = meta.participants.find(x=>x.id===sender); return p?.admin==="admin"||p?.admin==="superadmin"; }catch(e){ return false; } };
    if(GESTOS_SOLO[cmd.slice(1)]){ let g=GESTOS_SOLO[cmd.slice(1)]; return reply(`${g[0]} ${nombre(sender)} ${g[1]}`); }
    if(GESTOS_DUO[cmd.slice(1)] || (cmd==="#dance" && getMention())){ let target = getMention(); if(!target) return reply("Mencioná a alguien. Ej: #hug @persona"); let g=GESTOS_DUO[cmd.slice(1)]; if(cmd==="#dance") return reply(`💃 ${nombre(sender)} baila con ${nombre(target)}`); return reply(`${g[0]} ${nombre(sender)} ${g[1]} ${nombre(target)}`); }
    if(cmd==="#help"||cmd==="#menu") return reply(`💖 *COMANDOS DE FRIEND LOVE COMMUNITY* 💖\nMoneda: ${moneda()}\n\n💰 ECONOMIA\n#bal #daily #w #crime #slut #robar @user #d #winch\n\n🎭 PERSONAJES\n#tienda #rw #claim #vote #ginfo #vender #regalar #intercambiar #comprar\n\n💞 SOCIAL\n#marry @user #divorce #perfil #setcumple 15/03 #ship @user\n#happy #cry #dance #sleep #angry #laugh #blush #shy #bored #think\n#hug #kiss #pat #slap #bite #poke #cuddle #handhold #highfive #wave #stare #smack #tickle #punch #kick #feed #comfort #carry #propose\n\n🛡️ ADMINS\n#open #close #warn #ban #setmoneda Nombre #anuncio texto`);
    if(cmd==="#bal") return reply(`🪙 ${nombre(sender)}\nMano: ${u.coins.toLocaleString()} ${moneda()}\nBanco: ${u.banco.toLocaleString()} ${moneda()}\nTotal: ${(u.coins+u.banco).toLocaleString()}`);
    if(cmd==="#daily"){ let ahora=Date.now(); let diff=ahora-u.lastDaily; if(diff < 24*60*60*1000 && u.lastDaily!==0) return reply(`⏳ Ya has usado el #daily, espera ${fmt(24*60*60*1000-diff)} para usarlo nuevamente`); if(diff > 48*60*60*1000) u.racha=0; u.racha+=1; let premio=30000 + (u.racha*5000); u.coins+=premio; u.lastDaily=ahora; save(); return reply(`🎁 #DAILY DÍA ${u.racha}\nGanaste *${premio.toLocaleString()} ${moneda()}* 🔥\nRacha: ${u.racha} días\nVolvé en 24hs`); }
    if(cmd==="#w"||cmd==="#work"){ if(Date.now()-u.lastWork < 2*60*1000) return reply(`⏳ Esperá ${fmt(2*60*1000-(Date.now()-u.lastWork))} para #w`); let g=rand(3000,4000); let trabajos=["Trabajaste en una cafetería","Ayudaste a repartir pedidos","Cuidaste la tienda de tu tía","Trabajaste de mesero","Ayudaste a limpiar la plaza"]; u.coins+=g; u.lastWork=Date.now(); save(); return reply(`💼 ${trabajos[rand(0,trabajos.length-1)]} y ganaste *${g} ${moneda()}*`); }
    if(cmd==="#crime"){ if(Date.now()-u.lastCrime < 10*60*1000) return reply(`⏳ Esperá ${fmt(10*60*1000-(Date.now()-u.lastCrime))} para #crime`); u.lastCrime=Date.now(); if(Math.random()<0.4){ let multa=rand(5000,10000); let quita=Math.min(multa,u.coins); u.coins-=quita; save(); return reply(`🚨 Te atrapó la policía y te multaron con *${quita} ${moneda()}*. Si tenías todo en el banco no te quitan nada.`); } let g=rand(5000,8000); u.coins+=g; save(); return reply(`🥷 Robaste un banco y conseguiste *${g} ${moneda()}*`); }
    if(cmd==="#slut"){ if(Date.now()-u.lastSlut < 20*60*1000) return reply(`⏳ Esperá ${fmt(20*60*1000-(Date.now()-u.lastSlut))} para #slut`); u.lastSlut=Date.now(); if(Math.random()<0.4){ let multa=rand(5000,10000); let quita=Math.min(multa,u.coins); u.coins-=quita; save(); return reply(`😭 Te dio vergüenza en frente de todos y perdiste *${quita} ${moneda()}*`); } let g=rand(5000,8000); u.coins+=g; save(); return reply(`💅 Fuiste la persona más popular de la fiesta y te dieron propina de *${g} ${moneda()}*`); }
    if(cmd==="#ginfo") return reply(`⏰ TIEMPOS DE ${nombre(sender)}\n\nRollwaifu: ${fmt(15*60*1000-(Date.now()-u.lastRw))}\nClaim: ${fmt(25*60*1000-(Date.now()-u.lastClaim))}\nVote: ${fmt(90*60*1000-(Date.now()-u.lastVote))}`);
    if(cmd==="#tienda"){ let t=tiendaHoy(); let txt=`🛒 *TIENDA DE HOY - Se renueva cada día*\n\n`+t.map((p,i)=>`${i+1}. ${p.nombre} - ${p.precio.toLocaleString()} ${moneda()}\n   #comprar ${p.nombre}`).join("\n"); return reply(txt); }
    if(cmd==="#rw"){ if(Date.now()-u.lastRw < 15*60*1000) return reply(`⏳ Esperá ${fmt(15*60*1000-(Date.now()-u.lastRw))} para #rw`); u.lastRw=Date.now(); let p=PERSONAJES[rand(0,PERSONAJES.length-1)]; u.ultimoPersonaje=p; save(); return reply(`🎲 Te salió *${p}* !\nPoné #claim para quedártelo`); }
    if(cmd==="#claim"){ if(!u.ultimoPersonaje) return reply("Primero usá #rw"); if(Date.now()-u.lastClaim < 25*60*1000) return reply(`⏳ Esperá ${fmt(25*60*1000-(Date.now()-u.lastClaim))} para #claim`); u.lastClaim=Date.now(); u.personajes.push(u.ultimoPersonaje); let p=u.ultimoPersonaje; u.ultimoPersonaje=null; save(); return reply(`✅ Reclamaste a *${p}*! Ahora es tuyo.`); }
    if(cmd==="#vote"){ if(Date.now()-u.lastVote < 90*60*1000) return reply(`⏳ Esperá ${fmt(90*60*1000-(Date.now()-u.lastVote))} para #vote`); u.lastVote=Date.now(); u.coins+=2000; save(); return reply(`🗳️ Votaste y ganaste 2.000 ${moneda()}. ¡Gracias!`); }
    if(cmd==="#comprar"){ let nom=args.slice(1).join(" "); let t=tiendaHoy(); let item=t.find(x=>x.nombre.toLowerCase()===nom.toLowerCase()); if(item){ if(u.coins<item.precio) return reply("No tenés suficientes coins en mano. Usá #d para pasar del banco."); u.coins-=item.precio; u.personajes.push(item.nombre); save(); return reply(`✅ Compraste a *${item.nombre}* por ${item.precio} ${moneda()}`); } let v=DB.config.ventas.find(x=>x.personaje.toLowerCase()===nom.toLowerCase()); if(v){ if(u.coins<v.precio) return reply("No tenés plata."); u.coins-=v.precio; user(v.vendedor).coins+=v.precio; u.personajes.push(v.personaje); DB.config.ventas=DB.config.ventas.filter(x=>x!==v); save(); return reply(`✅ Le compraste *${v.personaje}* a ${nombre(v.vendedor)} por ${v.precio}`); } return reply("Ese personaje no está en la tienda."); }
    if(cmd==="#vender"){ let personaje=args[1]; let precio=parseInt(args[2]); if(!u.personajes.includes(personaje)) return reply(`❌ No tenés este personaje en tu lista de personajes`); if(!precio){ u.personajes=u.personajes.filter(x=>x!==personaje); u.coins+=10000; save(); return reply(`Vendiste a ${personaje} al bot por 10.000 ${moneda()}`); } u.personajes=u.personajes.filter(x=>x!==personaje); DB.config.ventas.push({personaje, precio, vendedor:sender}); save(); return reply(`🛒 ${nombre(sender)} está vendiendo a *${personaje}* por *${precio} ${moneda()}*.\nPoné #comprar ${personaje} para comprarlo`); }
    if(cmd==="#regalar"){ let personaje=args[1]; let target=getMention(); if(!target) return reply("Ej: #regalar Goku @Maria"); if(!u.personajes.includes(personaje)) return reply(`❌ No tenés este personaje en tu lista de personajes`); u.personajes=u.personajes.filter(x=>x!==personaje); user(target).personajes.push(personaje); save(); return reply(`🎁 ${nombre(sender)} le regaló *${personaje}* a ${nombre(target)}. ¡Qué romántico!`); }
    if(cmd==="#intercambiar"){ let txt=text.replace("#intercambiar","").trim(); let partes=txt.split(" por "); if(partes.length<2) return reply("Ej: #intercambiar Goku por Gojo @Maria"); let mio=partes[0].trim(); let resto=partes[1].trim(); let target=getMention(); let suyo=resto.replace(/@\d+/,"").trim(); if(!u.personajes.includes(mio)) return reply(`❌ No tenés este personaje en tu lista de personajes`); if(!user(target).personajes.includes(suyo)) return reply(`${nombre(target)} no tiene a ${suyo}`); DB.config.intercambios[target]={de:sender, mio, suyo}; save(); return reply(`🔄 ${nombre(sender)} quiere intercambiarte su *${mio}* por tu *${suyo}*. ¿Aceptás? Respondé #si o #no`); }
    if(cmd==="#si"){ let inter=DB.config.intercambios[sender]; if(!inter) return; let a=user(inter.de); let b=user(sender); a.personajes=a.personajes.filter(x=>x!==inter.mio); b.personajes=b.personajes.filter(x=>x!==inter.suyo); a.personajes.push(inter.suyo); b.personajes.push(inter.mio); delete DB.config.intercambios[sender]; save(); return reply(`✅ Intercambio hecho!`); }
    if(cmd==="#no"){ delete DB.config.intercambios[sender]; save(); return reply("❌ Intercambio rechazado"); }
    if(cmd==="#marry"){ let t=getMention(); if(!t) return reply("Ej: #marry @persona"); u.casado=t; user(t).casado=sender; save(); return reply(`💍 ${nombre(sender)} y ${nombre(t)} ahora están casados!`); }
    if(cmd==="#divorce"){ u.casado=null; save(); return reply("💔 Te divorciaste"); }
    if(cmd==="#perfil"){ let top=Object.entries(DB.users).sort((a,b)=>(b[1].coins+b[1].banco)-(a[1].coins+a[1].banco)); let rank=top.findIndex(x=>x[0]===sender)+1; return reply(`👤 PERFIL DE ${nombre(sender)} - Friend Love Community\n💍 Casado con: ${u.casado?nombre(u.casado):"Soltero"}\n🎂 Cumpleaños: ${u.cumple||"No puesto"}\n🪙 ${moneda()}: ${(u.coins+u.banco).toLocaleString()}\n🔥 Racha Daily: ${u.racha} días\n🏆 Ranking: #${rank}\n🎭 Colección: ${u.personajes.length} personajes\n${u.personajes.join(", ")||"Sin personajes"}`); }
    if(cmd==="#setcumple"){ u.cumple=args[1]||""; save(); return reply(`🎂 Cumpleaños guardado: ${u.cumple}`); }
    if(cmd==="#rank"){ let top=Object.entries(DB.users).sort((a,b)=>(b[1].coins+b[1].banco)-(a[1].coins+a[1].banco)).slice(0,10); return reply(`🏆 TOP RICOS - ${moneda()}\n`+top.map((x,i)=>`${i+1}° ${nombre(x[0])} - ${(x[1].coins+x[1].banco).toLocaleString()}`).join("\n")); }
    if(cmd==="#setmoneda"){ if(!(await isAdmin())) return reply("Solo admins pueden cambiar el nombre de la moneda"); DB.config.moneda=args.slice(1).join(" ")||"ovio coin"; save(); return reply(`Moneda cambiada a: ${DB.config.moneda}`); }
    if(cmd==="#d"){ let cant=parseInt(args[1])||u.coins; cant=Math.min(cant,u.coins); u.coins-=cant; u.banco+=cant; save(); return reply(`🏦 Depositaste ${cant} ${moneda()}`); }
    if(cmd==="#winch"){ let cant=parseInt(args[1])||u.banco; cant=Math.min(cant,u.banco); u.banco-=cant; u.coins+=cant; save(); return reply(`🏦 Retiraste ${cant} ${moneda()}`); }
    if(cmd==="#robar"){ let t=getMention(); if(!t) return reply("Ej: #robar @persona"); if(Date.now()-u.lastRobar < 60*60*1000) return reply(`⏳ Esperá ${fmt(60*60*1000-(Date.now()-u.lastRobar))}`); u.lastRobar=Date.now(); let victima=user(t); let g=rand(1000,5000); g=Math.min(g, victima.coins); victima.coins-=g; u.coins+=g; save(); return reply(`🥷 Le robaste ${g} ${moneda()} a ${nombre(t)}`); }
    if(cmd==="#open"||cmd==="#close"){ if(!(await isAdmin())){ await react("✖️"); return; } await react("✅"); if(cmd==="#close"){ try{ await sock.groupSettingUpdate(jid,"announcement"); }catch(e){} return reply(`🔒 Grupo cerrado por ${nombre(sender)}. Solo los admins pueden hablar`); } else { try{ await sock.groupSettingUpdate(jid,"not_announcement"); }catch(e){} return reply(`🔓 Grupo abierto por ${nombre(sender)}. Ya pueden hablar todos`); } }
    if(cmd==="#warn"){ if(!(await isAdmin())) return; let t=getMention(); return reply(`⚠️ ${nombre(t)} tiene un warn`); }
    if(cmd==="#ban"){ if(!(await isAdmin())) return; let t=getMention(); if(t&&isGroup){ try{ await sock.groupParticipantsUpdate(jid,[t],"remove"); }catch(e){} } return reply("Usuario baneado"); }
    if(cmd==="#anuncio"){ if(!(await isAdmin())) return; return reply(`📢 ANUNCIO\n${text.replace("#anuncio","").trim()}`); }
    if(cmd==="#ship"){ let t=getMention(); if(!t) return reply("Ej: #ship @persona"); return reply(`💘 ${nombre(sender)} ❤️ ${nombre(t)} = ${rand(40,100)}% compatibles`); }
    if(cmd==="#bienvenido") return reply("¡Bienvenido a Friend Love Community! 💖 Usá #help para ver los comandos");
  });
}
start();
