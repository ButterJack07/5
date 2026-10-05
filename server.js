import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const files=new Set(['index.html','style.css','app.js','game.js','input.js']);
const mime={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8'};
createServer(async(req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!files.has(name)){res.writeHead(404);res.end('Not found');return;}try{const data=await readFile(fileURLToPath(new URL(name,import.meta.url)));res.writeHead(200,{'Content-Type':mime[name.split('.').pop()],'Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(500);res.end('Server error');}}).listen(Number(process.env.PORT)||5173,'0.0.0.0',()=>console.log('Fogbound: http://localhost:5173'));
