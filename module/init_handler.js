const crypto = require('./crypto_handler')
const fetch = require('molly-fetch');
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const db = new Object(); 

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function fillDB( _db, _table, _path, _pass ){
    return new Promise(async(response,reject)=>{

        let _itr = undefined;

        if( (/^http/).test(_path) ){ try{
            const stream = await fetch(_path,{responseType:'stream'});
            _itr = readline.createInterface({ input: stream.data });
        } catch(e) { return response(`error reading ${_path}`); }}

        else if( fs.existsSync(_path) )
            _itr = readline.createInterface({
                input: fs.createReadStream(_path)
            });
        
        else { return response(`error reading ${_path}`); }     

        _itr.on('line',(line)=>{
            db[_db][_table].push(crypto.decrypt( line,_pass ));
        }); _itr.on('close',()=>{ response() });
        
    });
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = function(args){
    return new Promise(async(response,reject)=>{
        try {
    
            const dir = path.join(args.path,'_init_.json');
            
            db._buff_ = fs.readFileSync( dir );
            db._init_ = JSON.parse( db._buff_ );
            db._path_ = args.path; delete db._buff_;
            
            for( var i in db._init_.DB ){
    
                const DB = db._init_.DB[i]; const name = DB.name;
                delete db[name]; db[name] = new Object();
        
                for( var j in DB.tables ){ 
                    const table = DB.tables[j]; const dir = path.join(db._path_,`${table}.json`);
                    db[name][table] = new Array(); await fillDB( name,table,dir,args.pass );
                }
        
            }
    
        } catch(e) {
            db._init_ = {DB:[]}; db._path_ = args.path;
            const dir = path.join(args.path,'_init_.json');
            fs.writeFileSync( dir,JSON.stringify(db._init_) );
        }   response(db);
    });
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/