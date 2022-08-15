const worker = require('worker_threads');
const readline = require('readline');
const crypto = require('./_crypto_');
const {Buffer} = require('buffer'); 
const fetch = require('axios');
const http = require('http');
const url = require('url');
const fs = require('fs');

const query = worker.workerData;
const db = new Object();

/* --------------------------------------------------------------------------------------- */

function app(req,res){
    eval( fs.readFileSync(`${__dirname}/_server_.js`).toString() );
}

/* --------------------------------------------------------------------------------------- */

function _init_(){
    return new Promise((response,reject)=>{
        eval( fs.readFileSync(`${__dirname}/_init_.js`).toString() );
    });
}

/* --------------------------------------------------------------------------------------- */

(()=>{
    try{
        http.createServer( app ).listen( query.port,()=>{
            console.log('molly-db is running, please wait');
            _init_().then(()=>{
                worker.parentPort.postMessage(
                    `server started -> http://localhost:${query.port}`
                );
            }).catch(e=>{ process.exit(1); });
        });
    } catch(e) { process.exit(1); }
})();

/* --------------------------------------------------------------------------------------- */
