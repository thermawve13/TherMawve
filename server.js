const express=require("express");
const session=require("express-session");
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const app=express(),DB=path.join(__dirname,"data.json");
function db(){if(!fs.existsSync(DB))fs.writeFileSync(DB,JSON.stringify({users:[],transactions:[]},null,2));return JSON.parse(fs.readFileSync(DB,"utf8"))}
function save(d){fs.writeFileSync(DB,JSON.stringify(d,null,2))}
function hash(x){return crypto.createHash("sha256").update(x).digest("hex")}
function me(req,d){return d.users.find(x=>x.id===req.session.uid)}
app.use(express.json());app.use(express.static(path.join(__dirname,"public")));
app.use(session({secret:"ther-mawve-premium-demo",resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax"}}));
app.post("/api/register",(q,s)=>{let u=String(q.body.username||"").trim(),p=String(q.body.password||"");if(!/^[A-Za-z0-9_]{3,20}$/.test(u))return s.status(400).json({error:"Username 3–20 karakter."});if(p.length<6)return s.status(400).json({error:"Password minimal 6 karakter."});let d=db();if(d.users.some(x=>x.username.toLowerCase()===u.toLowerCase()))return s.status(409).json({error:"Username sudah digunakan. Silakan Login."});let x={id:crypto.randomUUID(),username:u,password_hash:hash(p),balance:0,created_at:new Date().toISOString()};d.users.push(x);save(d);q.session.uid=x.id;s.json({ok:true})});
app.post("/api/login",(q,s)=>{let u=String(q.body.username||"").trim(),p=String(q.body.password||""),d=db(),x=d.users.find(a=>a.username.toLowerCase()===u.toLowerCase());if(!x||x.password_hash!==hash(p))return s.status(401).json({error:"Username atau password salah."});q.session.uid=x.id;s.json({ok:true})});
app.post("/api/logout",(q,s)=>q.session.destroy(()=>s.json({ok:true})));
app.get("/api/me",(q,s)=>{let d=db(),u=me(q,d);if(!u)return s.status(401).json({error:"Belum login"});s.json({user:{username:u.username,balance:u.balance}})});
app.get("/api/history",(q,s)=>{let d=db(),u=me(q,d);if(!u)return s.status(401).json({error:"Belum login"});s.json({transactions:d.transactions.filter(t=>t.user_id===u.id).sort((a,b)=>b.created_at.localeCompare(a.created_at))})});
app.post("/api/topup",(q,s)=>{let d=db(),u=me(q,d),a=Number(q.body.amount);if(!u)return s.status(401).json({error:"Belum login"});if(!Number.isSafeInteger(a)||a<100||a>1000000)return s.status(400).json({error:"Nominal Rp100–Rp1.000.000."});u.balance+=a;d.transactions.push({id:crypto.randomUUID(),user_id:u.id,type:"TOPUP_DEMO",amount:a,other_username:"",created_at:new Date().toISOString()});save(d);s.json({ok:true})});
app.post("/api/transfer",(q,s)=>{let d=db(),u=me(q,d),to=String(q.body.username||"").trim(),a=Number(q.body.amount);if(!u)return s.status(401).json({error:"Belum login"});let v=d.users.find(x=>x.username.toLowerCase()===to.toLowerCase());if(!v)return s.status(404).json({error:"Username penerima tidak ditemukan."});if(v.id===u.id)return s.status(400).json({error:"Tidak bisa transfer ke diri sendiri."});if(!Number.isSafeInteger(a)||a<100)return s.status(400).json({error:"Minimal transfer Rp100."});if(u.balance<a)return s.status(400).json({error:"Saldo virtual tidak cukup."});u.balance-=a;v.balance+=a;let t=new Date().toISOString();d.transactions.push({id:crypto.randomUUID(),user_id:u.id,type:"TRANSFER_OUT",amount:a,other_username:v.username,created_at:t},{id:crypto.randomUUID(),user_id:v.id,type:"TRANSFER_IN",amount:a,other_username:u.username,created_at:t});save(d);s.json({ok:true})});
app.listen(3000,"0.0.0.0",()=>console.log("Ther Mawve Premium berjalan di http://localhost:3000"));
