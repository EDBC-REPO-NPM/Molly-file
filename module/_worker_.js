const worker = require('worker_threads');
const readline = require('readline');
const crypto = require('./_crypto_');
const { Buffer } = require('buffer'); 
const fetch = require('molly-fetch');
const cluster = require('cluster');
const http = require('http');
const url = require('url');
const fs = require('fs');

/* --------------------------------------------------------------------------------------- */

let query;
const db = new Object();

/* --------------------------------------------------------------------------------------- */

function _init_(){
    try{ return eval( fs.readFileSync(`${__dirname}/_init_.js`).toString() );
    } catch(e){ console.log(e); }
}

/* --------------------------------------------------------------------------------------- */

function app(req,res){
    try{ eval( fs.readFileSync(`${__dirname}/_server_.js`).toString() );
    } catch(e) { console.log(e) }
}

/* --------------------------------------------------------------------------------------- */

module.exports = (args)=>{ query = args;
    return new Promise((response,reject)=>{
        if (cluster.isPrimary) { const worker = cluster.fork();
            cluster.on('exit', (worker, code, signal) => { cluster.fork();
                console.log(`worker ${worker.process.pid} died`);
            }); worker.on('message', (msg)=>{ console.log(msg); response(); }); 
                worker.on('exit', (msg)=>{ reject(msg); });
        } else {
            http.createServer( app ).listen( query.port,()=>{
                _init_().then(()=>{ process.send({
                    workerID: process.pid, port: query.port,
                    protocol: 'HTTP', status: 'started',
                })}).catch(e=>{ console.log(e); });
            });      
        }
    });
}

/* --------------------------------------------------------------------------------------- */
