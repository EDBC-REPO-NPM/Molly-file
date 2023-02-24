/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

const file = require('./file_handler');
const fetch = require('molly-fetch');
const crypto = require('crypto-js');
const {Buffer} = require('buffer');
const stream = require('stream');
const path = require('path');
const output = new Object();
const url = require('url');
const fs = require('fs');
const os = require('os');

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function getStream( options ){
    return new Promise((response,reject)=>{
        const { range, mime } = options.headers;
        file( options ).then(res=>response(res))
                       .catch(rej=>reject(rej))
    });
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

output.http = function(req,res){
    try { const options = new Object();

        /* options */
        options.decode       = false;
        options.responseType = 'stream';
        options.url          = req.url.slice(1);
        options.range        = req.headers.range  || null;
        options.method       = req.method         || 'GET';
        options.headers      = req.headers        || new Object();
        options.hash         = req.headers.hash   || crypto.SHA256(options.url).toString(); 
        options.path         = path.join( os.tmpdir(), options.hash );
        /* options */

        getStream( options ).then((response)=>{
            res.writeHead( response.status, response.headers );
            const out = response.stream || response.data;
            out.pipe(res);
        }).catch(e=>{ 
            res.writeHead(404,{'Content-Type': 'text/html'});
            return res.end(`error: ${e}`);
        });
          
    } catch(e) {
        res.writeHead(404,{'Content-Type': 'text/html'});
        if( e.message ) 
             return res.end(`error: not a valid URL`);
        else return res.end(`error: ${e}`);
    }
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = output;