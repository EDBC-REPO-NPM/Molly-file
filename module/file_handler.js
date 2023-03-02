/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

const memory = require('./memory_handler');
const fetch = require('molly-fetch');
const cluster = require('cluster');
const stream = require('stream');
const output = new Object();
const fs = require('fs');

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function expirationAge(){
    const today = new Date();
    const tomrw = new Date();
    tomrw.setDate( tomrw.getDate() + 1 );
    tomrw.setHours(0); tomrw.setSeconds(0);
    tomrw.setMinutes(0); tomrw.setMilliseconds(0);
	return parseInt((tomrw.getTime()-today.getTime())/Math.pow(10,3));
}

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

module.exports = function(db,req,res,arg,opt){

    function str(){
        fetch( opt ).then(rej=>{ 

            rej.headers["cache-control"] = `public, max-age=${ expirationAge() }`;
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
				res.end(e);
            });
            

        }).catch(rej=>{
			try {
				if( opt.headers.range ) rej.status = 100;
				res.writeHeader( rej.status, rej.headers );
				rej.data.pipe( res );
			} catch(e) {
				res.writeHeader( 404, {'content-type':'text/plain'} );
				res.end(e.message);
			}
        })
    }
    
    send(db,arg,{
        type: 'hash', target: opt.hash,
        table:'file', db:'metadata',
    }).then(msg=>{ const data = msg[0].data;
        if( !data.length || !fs.existsSync(data[0].path) ) return str(); 
        const rdb = fs.createReadStream( data[0].path );
        res.writeHead( data[0].status,data[0].headers );
        rdb.pipe(res);
    }).catch(e=>{ str() });

}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/