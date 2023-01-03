const cluster = require('cluster');
const {Buffer} = require('buffer');
const output = new Object();

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

output.http = function(req,res){

    if( req.method != 'POST' ){
        res.writeHead(200,{'content-type': 'text/plain'});
        return res.end('Only Post Method Avalilable');
    }   const raw = new Array();

    req.on('close',()=>{ process.send(Buffer.concat(raw)) });
    req.on('data',(chunk)=>{ raw.push(chunk) });

    cluster.worker.once('message',(msg)=>{
        const status = msg.match(/\d+/i)[0];
        res.writeHead(status,{'content-type': 'text/plain'});
        res.write(msg); res.end();
    })

}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

output.WebSocket = function( message,client ){
    cluster.worker.once('message',(msg)=>{
        client.send(msg);
    }); process.send(message);
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

output.Socket = function( message,client ){
    cluster.worker.once('message',(msg)=>{
        client.write(msg);
    }); process.send(message);
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = output;

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/