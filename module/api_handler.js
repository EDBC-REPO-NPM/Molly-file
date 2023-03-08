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

output.http = function(db,req,res,arg){

    try { const opt = new Object();

        /* opt */
        opt.decode       = false;
        opt.responseType = 'stream';
        opt.method       = req.method        || 'GET';
        opt.headers      = req.headers       || new Object();

        const st  = !req.headers.range ? 0 : +req.headers.range.match(/\d+/i)[0];
        const ch  = +opt.headers['chunk-size'] || (Math.pow(10,6)*10);
        const trg =`${req.url}|${Math.floor(st/ch)*ch}|${req.method}`;

        opt.url          = Buffer.from(req.url.slice(1),'base64').toString();
        opt.hash         = req.headers.hash  || crypto.SHA256(trg).toString(); 
        opt.path         = path.join( os.tmpdir(), opt.hash );
        /* opt */

        file( db,req,res,arg,opt )
          
    } catch(e) {
        res.writeHead(404,{'content-type': 'text/html'});
        if( e.message ) 
             return res.end(`error: not a valid URL`);
        else return res.end(`error: ${e}`);
    }
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = output;