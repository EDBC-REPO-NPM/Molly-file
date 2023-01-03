/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

const memory = require('./memory_handler');
const worker = require('worker_threads');
const init = require('./init_handler');
const {Buffer} = require('buffer');
const utils = require('./utils');
const path = require('path');

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function Error(error){ console.log(`worker error: ${error}`); }
function Exit(code){ console.log(`worker exit code: ${code}`); }

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function saveTimeout(data,db){
    setTimeout(() => {
        if( db._update_ ){
            db._update_ = false;
            utils.saveAll(data,db);
        }
    }, data.time * 3600 * 1000 );
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = (args)=>{
    init( args ).then((db)=>{ saveTimeout( args, db );
        const dir = path.join(__dirname,'server_worker.js');
        const srv = new worker.Worker(dir,{ workerData: args });
        srv.on('error',Error); srv.on('exit',Exit); srv.on('message',(msg)=>{
            const empty = '{ "status":"404", "message":"empty data" }';
            const error = '{ "status":"404", "message":"error data" }';
            try {
                const raw = Buffer.from(msg).toString(); 
                memory(args,JSON.parse(raw),db).then(x=>{ 
                    const out = JSON.stringify(x); srv.postMessage(out||empty);
                }).catch(e=>{
                    const out = JSON.stringify(e); srv.postMessage(out||empty);
                })
            } catch(e) { console.log(e); srv.postMessage(error) }
        });
    }).catch((e)=>{ console.log(e) });
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/