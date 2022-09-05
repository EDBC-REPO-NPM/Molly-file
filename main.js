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

function startWorker(_path,_self){
    return new Promise((response,reject)=>{
        const wrk = new worker.Worker(
            _path,{ workerData:_self,
                env: worker.SHARE_ENV,
        }); wrk.on('exit',(err)=>{ console.log(err);
            response(startWorker(_path,_self));
        }); wrk.on('message',(msg)=>{ 
            console.log(msg); response(msg) 
        });
    });
}

/* --------------------------------------------------------------------------------------- */

class molly_db{

    constructor( opt ){
        if( opt.pass )
            this.pass = opt.pass;
            this.port = opt.port || 27017;
            this.path = opt.path.replace(/^\./,process.cwd());
            this.workerPath = `${__dirname}/module/_worker_.js`;
        return startWorker( this.workerPath,this );
    }

}

/* --------------------------------------------------------------------------------------- */

module.exports = molly_db;
