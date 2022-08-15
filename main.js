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

    constructor( opt ){
        return new Promise((response,reject)=>{
            if( opt.pass )
                this.pass = opt.pass;
                this.port = opt.port || 27017;
                this.type = opt.type || 'local';
                this.path = opt.path.replace(/^\./,process.cwd());
            
            if( this.worker ) return console.log(`server is running`);

            this.worker = new worker.Worker(
                   `${__dirname}/module/_worker_.js`,{
                    env: worker.SHARE_ENV,
                    workerData: this
                }
            );

            this.worker.on('exit',(err)=>{ reject('') });
            this.worker.on('error',(err)=>{ reject('') });
            this.worker.on('message',(msg)=>{ response('') });
        });
    }

}

/* --------------------------------------------------------------------------------------- */

module.exports = molly_db;
