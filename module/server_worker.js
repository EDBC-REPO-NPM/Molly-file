const worker = require('worker_threads');
const app = require('./api_handler');
const cluster = require('cluster');
const http = require('http');
const net = require('net');
const ws = require('ws');

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function createHTTPServer(){
    http.createServer( app.http ).listen( process.env.port,()=>{
        console.log({
            protocol: 'HTTP', status: 'started',
            wrkID: process.pid, port: process.env.port,
        });
    });
}

function createWebSocketServer(){
    const srv = new ws.WebSocketServer({ port: process.env.port });
    srv.on('connection',(client)=>{
        client.on('message',(msg)=>app.WebSocket(msg,client));
    }); console.log ({
        protocol: 'WebSocket', status: 'started',
        wrkID: process.pid, port: process.env.port,
    });
}

function createSocketServer(){
    const srv = net.createServer({ port: process.env.port });
    srv.on('connection',(client)=>{
        client.on('message',(msg)=>app.Socket(msg,client));
    }); console.log ({
        protocol: 'Socket', status: 'started',
        wrkID: process.pid, port: process.env.port,
    });
}

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
        switch( process.env.protocol ){
            case 'WebSocket': createWebSocketServer(); break;
            case 'Socket': createSocketServer(); break;
            default: createHTTPServer(); break;
        }
    } 
    
})();

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/