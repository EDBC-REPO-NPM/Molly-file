const path = require('path');
const os = require('os');
const fs = require('fs');
const db = new Object(); 

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = function(args){
    return new Promise(async(response,reject)=>{
        db._init_ = {DB:[]}; db._path_ = args.path;
        for( let file of fs.readdirSync('/tmp') ){
            const dir = path.join( os.tmpdir(),file );
            if( file.length == 64 ) fs.unlinkSync(dir);
        }   response(db);
    });
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/