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

const db = new Object();
const api_script = fs.readFileSync(`${__dirname}/_api_.js`).toString();
const app_script = fs.readFileSync(`${__dirname}/_app_.js`).toString();
const init_script = fs.readFileSync(`${__dirname}/_init_.js`).toString();
//const importDB_script = fs.readFileSync(`${__dirname}/_importDB.js`).toString();

/* --------------------------------------------------------------------------------------- */

async function _init_(){ await eval(`try{ ${init_script} }catch(e){console.log(e)}`) }
async function _importDB_(){ await eval(`try{ ${importDB_script} }catch(e){console.log(e)}`) }
async function app(req,res){ await eval(`try{ ${api_script} \n ${app_script} }catch(e){console.log(e)}`) }

/* --------------------------------------------------------------------------------------- */
function saveTimeout(){
    time = process.mollyDB.time * 3600000;
    setTimeout(() => {
        if( db._update_ == true ){
            const api = url.format({
                path: '/saveAll?db=&table=',
                port: process.mollyDB.port,
                host: 'http://127.0.0.1',
            }); fetch(api).then().catch();
            db._update_ = false;
        }
    }, time);
}
/* --------------------------------------------------------------------------------------- */

module.exports = (args)=>{ process.mollyDB = args;
    return new Promise((response,reject)=>{

        if( cluster.isPrimary ) 
            for ( let i=args.threads; i--; ){ cluster.fork();
                cluster.on('exit', (worker, code, signal) => { 
                    console.log(`worker ${worker.process.pid} died`);
                    cluster.fork();
                });
            }

        else 
            http.createServer( app ).listen( process.mollyDB.port,()=>{
                _init_().then(()=>{ 
                    console.log({
                        protocol: 'HTTP', status: 'started',
                        workerID: process.pid, port: process.mollyDB.port,
                    }); saveTimeout();
                }).catch(e=>{ console.log(e); reject(); });
            }); 

    });
}

/* --------------------------------------------------------------------------------------- */
