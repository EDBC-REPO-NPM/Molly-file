const worker = require('worker_threads');
const readline = require('readline');
const crypto = require('./_crypto_');
const { Buffer } = require('buffer'); 
const fetch = require('axios');
const http = require('http');
const url = require('url');
const fs = require('fs');

const query = worker.workerData;
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

(()=>{ http.createServer( app ).listen( query.port,()=>{
    _init_().then(()=>{ worker.parentPort.postMessage({
        workerID: process.pid, port: query.port,
        protocol: 'HTTP', status: 'started',
    }); }).catch(e=>{ process.exit(1); });
}); })();

/* --------------------------------------------------------------------------------------- */
