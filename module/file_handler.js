/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

const fetch = require('molly-fetch');
const cluster = require('cluster');
const stream = require('stream');
const output = new Object();
const fs = require('fs');

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function multipipe( input, ...output ){

    input.on('data',(chunk)=>{
        for( let out of output ) 
            out.write(chunk);
    });

    input.on('close',()=>{
        for( let out of output ) 
            out.end();
    });

}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function backend_fetch( args, data ){
    return new Promise((response,reject)=>{

        function str(){ 
            fetch( args ).then(res=>{ 

                process.send(JSON.stringify({
                    type: 'push', table: 'file', 
                    db: 'metadata', body: args
                }));

                res.stream = new stream.PassThrough(); 
                const wrt = fs.createWriteStream( args.path );
                multipipe( res.data, wrt, res.stream ); response( res );

            }).catch(rej=>{ 
                if( !args.range ) return response(rej);
                rej.status = 100; response(rej);
            })
        }

        cluster.worker.once('message',(msg)=>{
            const {data} = JSON.parse(msg)[0];
            if( !data.length || fs.existsSync(data[0].path) ) return str(); 
                data[0].data = fs.createReadStream( data[0].path );
                return response( data[0] );
        }); 
        
        process.send( JSON.stringify(data) );
    });
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = function( args ){
    return backend_fetch( args, {
        type: 'hash', target: args.hash,
        table:'file', db:'metadata',
    });
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/