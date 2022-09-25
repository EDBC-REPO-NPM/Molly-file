
function fillDB( _db, _table, _path ){
    return new Promise(async(response,reject)=>{

        let _itr = undefined;

        if( (/^http/).test(_path) ){ try{
            const stream = await fetch(_path,{responseType:'stream'});
            _itr = readline.createInterface({ input: stream.data });
        } catch(e) { console.log(`error reading ${_path}`); return response(); }}

        else if( fs.existsSync(_path) )
            _itr = readline.createInterface({
                input: fs.createReadStream(_path)
            });
        
        else { console.log(`error reading ${_path}`); return response(); }     

        _itr.on('line',(line)=>{
            db[_db][_table].push(crypto.decrypt( line,query.pass ));
        }); _itr.on('close',()=>{ response() });
        
    });
}

/* --------------------------------------------------------------------------------------- */

(()=>{ return new Promise(async(response,reject)=>{
    try {

        const path = `${query.path}/_init_.json`;

        if( (/^http/).test(query.path) ){
            const stream = await fetch(path);
            db._init_ = stream.data;
        } else{ 
            db._buff_ = fs.readFileSync( path );
            db._init_ = JSON.parse( db._buff_ );
        }

        db._path_ = query.path;
        for( var i in db._init_.DB ){

            const DB = db._init_.DB[i];
            const name = DB.name;
            delete db[name];

            db[name] = new Object();
    
            for( var j in DB.tables ){
                const table = DB.tables[j];
                const path = `${db._path_}/${table}.json`;
                db[name][table] = new Array(); await fillDB( name,table,path );
            }
    
        }

    } catch(e) {

        db._init_ = { DB:[] };
        db._path_ = query.path;
        const path = `${query.path}/_init_.json`;
        fs.writeFileSync( path,JSON.stringify(db._init_) );

    }   response();


}); })();