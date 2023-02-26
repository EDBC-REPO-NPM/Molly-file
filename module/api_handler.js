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

output.http = function(req,res){
    try { const options = new Object();

        /* options */
        options.decode       = false;
        options.responseType = 'stream';
        options.method       = req.method        || 'GET';
        options.headers      = req.headers       || new Object();

        const trg = `${req.url}|${req.headers.range}|${req.method}`;

        options.url          = Buffer.from(req.url.slice(1),'base64').toString();
        options.hash         = req.headers.hash  || crypto.SHA256(trg).toString(); 
        options.path         = path.join( os.tmpdir(), options.hash );
        /* options */

        file( req,res,options )
          
    } catch(e) {
        res.writeHead(404,{'Content-Type': 'text/html'});
        if( e.message ) 
             return res.end(`error: not a valid URL`);
        else return res.end(`error: ${e}`);
    }
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = output;