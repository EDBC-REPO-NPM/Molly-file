const worker = require('worker_threads');
const app = require('./api_handler');
const cluster = require('cluster');
const http = require('http');
const net = require('net');
const ws = require('ws');

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

(()=>{

    if( cluster.isPrimary ) { 
        const env = worker.workerData;
        const data = worker.workerData;
        for ( let i=data.threads; i--; ){ 
            
            const wrk = cluster.fork(data,env);

            cluster.on('exit', (wrk, code, signal) => { cluster.fork(data,env);
                console.log(`wrk ${wrk.process.pid} died`);
            }); wrk.on('exit', (msg)=>{ console.log(msg); });

            wrk.on('message', (msg)=>{ worker.parentPort.postMessage(msg) });
            worker.parentPort.on('message',(msg)=>{ wrk.send(msg) });
       
        }
    } else {
        http.createServer( app.http ).listen( process.env.port, process.env.host, ()=>{
            console.log({
                protocol: 'HTTP', status: 'started',
                wrkID: process.pid, port: process.env.port,
                host: process.env.host
            });
        });
    } 
    
})();

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/