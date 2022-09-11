const worker = require('worker_threads');
const fetch = require('axios');
const url = require('url');
const fs = require('fs');

/* --------------------------------------------------------------------------------------- */

function config( _config ) {
    const _default = { offset:0, length:100 };
    if( !_config ) return _default;
    Object.keys(_config).map(x=>{
        _default[x] = _config[x];
    });
}

/* --------------------------------------------------------------------------------------- */

class molly_db{

    constructor( opt ){ if( opt.pass )
        this.pass = opt.pass; this.port = opt.port || 27017;
        this.path = opt.path.replace( /^\./,process.cwd() );
        return require(`${__dirname}/module/_worker_.js`)(this);
    }

}

/* --------------------------------------------------------------------------------------- */

module.exports = molly_db;
