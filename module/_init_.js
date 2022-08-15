
function fillDB( _db, _table, _path ){
    return new Promise(async(response,reject)=>{

        let _itr = undefined;

        if( (/^http/).test(_path) ){
            const stream = await fetch.get(_path,{responseType:'stream'});
            _itr = readline.createInterface({
                input: stream.data
            });
        
        } else    
            _itr = readline.createInterface({
                input: fs.createReadStream(_path)
            });

        _itr.on('close',()=>{ response() });
        _itr.on('line',(line)=>{
            db[_db][_table].push(crypto.decrypt( line,query.pass ));
        });
        
    });
}

/* --------------------------------------------------------------------------------------- */

(async()=>{
    try {

        const path = `${query.path}/_init_.json`;

        if( (/^http/).test(query.path) ){
            const stream = await fetch.get(path);
            db._init_ = stream.data;
        } else{ 
            db._buff_ = fs.readFileSync( path );
            db._init_ = JSON.parse( db._buff_ );
        }

        db._path_ = query.path;
        for( var i in db._init_.DB ){

            const DB = db._init_.DB[i];
            const name = DB.name;
    
            db[name] = new Object();
    
            for( var j in DB.tables ){
                const table = DB.tables[j];
                const path = `${db._path_}/${table}.json`;
                db[name][table] = new Array();
                await fillDB( name,table,path );
            }
    
        }

    } catch(e) {

        const path = `${query.path}/_init_.json`;
        db._buff_ = fs.readFileSync( path );
        db._path_ = query.path;
        db._init_ = { DB:[] }

        fs.writeFileSync( path,db._init_ );

    }   response();
})();