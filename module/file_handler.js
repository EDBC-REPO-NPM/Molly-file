/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

const memory = require('./memory_handler');
const fetch = require('molly-fetch');
const cluster = require('cluster');
const stream = require('stream');
const output = new Object();
const fs = require('fs');

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function multipipe( input, ...output ){
    input.on('data',(chunk)=>{ for( let out of output ) out.write(chunk) });
    input.on('close',()=>{ for( let out of output ) out.end() });
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function send( db,arg,msg ){
    const empty = { status:404, message:"empty data" };
    const error = { status:404, message:"error data" };
    return new Promise((response,reject)=>{
        try {memory(arg,msg,db)
            .then(x=> response(x||empty) )
            .catch(e=>response(e||empty) )
        } catch(e) { reject(error) }
    }) 
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function isChunkFinished( _data ){
    return new Promise(async(response,reject)=>{

        function wait(time){
            return new Promise((response,reject)=>{
                setTimeout(response,time);
            });
        } 

        let size = _data.headers['content-length'];
        let prev = fs.statSync(_data.path).size;
        let i = 0; while( true ){
            console.log( size, prev, i, size == prev );
            if( size == prev ) return response();
            if( !size || !prev ) return reject();
            await wait(100); if( i>3 ) return reject();
            if( prev == fs.statSync(_data.path).size ) 
                i++; prev = fs.statSync(_data.path).size;
        }

    });
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = function(db,req,res,arg,opt){

    function str(){
        fetch( opt ).then(rej=>{ 

            const wrt = fs.createWriteStream( opt.path );
            const body = { 
                headers: rej.headers, path: opt.path, 
                status: rej.status,   hash: opt.hash,
            }

            send(db,arg,{
                type: 'push', table: 'file', 
                db: 'metadata', body: body
            }).then(()=>{
                res.writeHead( rej.status, rej.headers );
                multipipe( rej.data, wrt, res );
            }).catch(e=>{
				res.writeHeader( 404, {'content-type':'text/plain'} );
				res.end(e.message);
            });

        }).catch(rej=>{
			try {
				if( url.headers.range && !(/text/i).test(url.headers['content-type']) ) 
					rej.status = 100; res.writeHeader( rej.status, rej.headers );
					rej.data.pipe( res );
			} catch(e) {
				res.writeHeader( 404, {'content-type':'text/plain'} );
				res.end(rej.message);
			}
        })
    }
    
    send(db,arg,{
        table:'file', db:'metadata',
        type: 'hash', target: opt.hash,
    }).then(msg=>{ const data = msg[0].data;
        if( !data.length || !fs.existsSync(data[0].path) ) 
            return str(); isChunkFinished( data[0] )
        .then(()=>{
            const rdb = fs.createReadStream( data[0].path );
            res.writeHead( data[0].status,data[0].headers );
            rdb.pipe(res);
        }).catch(()=>{ str() })
    }).catch(e=>{ str() });

}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/