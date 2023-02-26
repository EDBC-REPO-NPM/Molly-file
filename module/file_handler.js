/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

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
	return (tomrw.getTime()-today.getTime())/Math.pow(10,3);
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function multipipe( input, ...output ){
    input.on('data',(chunk)=>{ for( let out of output ) out.write(chunk) });
    input.on('close',()=>{ for( let out of output ) out.end() });
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = function( req,res,args ){

    function str(){
        fetch( args ).then(rej=>{ 

            rej.headers["Cache-Control"] = `public, max-age=${ expirationAge() }`;
            const wrt = fs.createWriteStream( args.path );
            process.send(JSON.stringify({
                type: 'push', table: 'file', 
                db: 'metadata', body: args
            }));

            res.writeHead( rej.status, rej.headers );
            multipipe( rej.data, wrt, res );

        }).catch(rej=>{ res.writeHead( 
                !args.headers.range ? 404 : 100,
                {'Content-Type': 'text/html'}
            ); try { rej.pipe(res) } catch(e) { res.end() }
        })
    }

    cluster.worker.once('message',(msg)=>{ const {data} = JSON.parse(msg)[0];
        if( !data.length || fs.existsSync(data[0].path) ) return str(); 
        res.writeHead( data[0].status, data[0].headers );
        const rdb = fs.createReadStream( data[0].path );
        rdb.pipe(res);
    }); 
    
    process.send(JSON.stringify({
        type: 'hash', target: args.hash,
        table:'file', db:'metadata',
    }));
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/