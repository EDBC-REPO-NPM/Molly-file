/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

const worker = require('worker_threads');
const init = require('./init_handler');
const app = require('./api_handler');
const {Buffer} = require('buffer');
const utils = require('./utils');
const path = require('path');
const http = require('http');

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function Error(error){ console.log(`worker error: ${error}`); }
function Exit(code){ console.log(`worker exit code: ${code}`); }

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function getTime(data){
    const today = new Date();
    const tomrw = new Date();
    tomrw.setHours(0); tomrw.setSeconds(0);
    tomrw.setMinutes(0); tomrw.setMilliseconds(0);
    tomrw.setDate( tomrw.getDate() + data.cache );
	return parseInt(tomrw.getTime()-today.getTime());
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function cacheTimeout(data,db){
    setTimeout(() => {
        utils.checkAll(data,db);
    }, getTime(data) );
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = (arg)=>{ init( arg ).then((db)=>{ 

        const server = http.createServer((req,res)=>app.http(db,req,res,arg));
        server.listen( arg.port, arg.host, ()=>{
            console.log(JSON.stringify({
                name: 'molly-file', protocol: 'HTTP', 
                port: arg.port, host: arg.host,
            }));
        }); cacheTimeout(arg,db);

    }).catch((e)=>{ console.log(e) });
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/