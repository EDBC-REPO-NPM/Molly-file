/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

const path = require('path');
const url = require('url'); 
const fs = require('fs');

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function config( _config ) {
    const _default = { offset:0, length:100 };
    if( !_config ) return _default;
    Object.keys(_config).map(x=>{
        _default[x] = _config[x];
    });
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

class molly_db{
    constructor( opt ){
        if(opt.pass) this.pass = opt.pass; this.port = opt.port || 27016;
        const dir = path.join(__dirname,'/module/worker_handler.js');

        if( !(new RegExp(process.cwd())).test(opt.path) )
             this.path = path.join(process.cwd(),opt.path);
        else this.path = opt.path;

        this.host = opt.host         || 'localhost';
        this.import = opt.import     || '';
        this.cache = opt.cacheTime   || 1;
        this.threads = opt.thread    || 1;
        
        return require(dir)(this);
    }
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = molly_db;
