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
        const dir = path.join(__dirname,'/module/worker_handler.js');
        this.host = opt?.host       || '127.0.0.1';
        this.port = opt?.port       || 27016;
        this.cache = opt?.cacheTime || 3;
        return require(dir)(this);
    }
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = molly_db;
