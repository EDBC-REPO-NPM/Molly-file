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
    } else { const port = Number( process.env.port );
        http.createServer( app.http ).listen( port, process.env.host, ()=>{
            console.log(JSON.stringify({
                name: 'molly-file', protocol: 'HTTP', port: port, host: process.env.host
            }));
        });
    } 
    
})();

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/
