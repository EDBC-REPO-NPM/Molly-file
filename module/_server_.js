
function text( _data ){
    res.writeHead(200,{'contetn-type':'text/plain'});
    res.end( _data );
}

function error( _error ){
    res.writeHead(200,{'contetn-type':'text/plain'});
    res.end(`error: ${_error.message}`);
    console.log(_error);
}

function json( _data ){
    res.writeHead(200,{'content-type':'application/json'});
    res.end(JSON.stringify(_data));
}

/* --------------------------------------------------------------------------------------- */

function getBody(){
    return new Promise((response,reject)=>{
        if( req.method == 'POST' ){
            const data = new Array();
            req.on('data',(chunk)=>{ data.push(chunk); });
            req.on('close',()=>{ response( Buffer.concat(data).toString() ); });
        } else { reject() }
    });
} 

function encryptDB( _db,_table, _path ){
    return new Promise((response,reject)=>{
        const writable = fs.createWriteStream( _path+'_tmp' );
        for( var i in db[_db][_table] ){
    
            const data = db[_db][_table][i];
            const ecrp = crypto.encrypt( data,query.pass );
    
            writable.write(`${ecrp}\n`);
        }   writable.end();
    
        writable.on('close',()=>{ 
            fs.renameSync( _path+'_tmp', _path ); 
            response('done');
        });
    
        writable.on('error',(e)=>{ 
            reject(e);
        });
    });
}

/* --------------------------------------------------------------------------------------- */

function list( _params ){
    return db[_params.db][_params.table].slice(
        _params.offset, Number(_params.offset)+Number(_params.length)
    ).map(x=>JSON.parse(x));
}

function match( _params ){
    const result = new Array();
    db[_params.db][_params.table].map((x)=>{
        const regex = new RegExp(crypto.slugify(_params.target),'gi');
        const target = crypto.slugify(x);
        if( regex.test(target) ) result.push(x);
    });
    return result.map(x=>JSON.parse(x)).slice(
        _params.offset, Number(_params.offset)+Number(_params.length)
    );
}

function hash( _params ){
    const result = new Array();
    db[_params.db][_params.table].map((x)=>{
        const regex = new RegExp(_params.target,'gi');
        if( regex.test(x) ) result.push(x);
    });
    return result.map(x=>JSON.parse(x)).slice(
        _params.offset, Number(_params.offset)+Number(_params.length)
    );
}

/* --------------------------------------------------------------------------------------- */

function shift( _params ){ 
    const result = db[_params.db][_params.table].shift(); 
    modifyDB( _params.db,_params.table ); return result;
}

function pop( _params ){ 
    const result = db[_params.db][_params.table].pop(); 
    modifyDB( _params.db,_params.table ); return result; return result; 
}

/* --------------------------------------------------------------------------------------- */

async function push( _params ){

    const body = await getBody();
    db[_params.db][_params.table].push( body );

    modifyDB( _params.db,_params.table );
    return {
        database: _params.db,
        table: _params.table,
        status: 'pushed'
    };

}

async function splice( _params ){

    const body = await getBody();
    db[_params.db][_params.table].splice(
        _params.offset,_params.length,body
    );

    modifyDB( _params.db,_params.table );
    return {
        database: _params.db,
        table: _params.table,
        status: 'spliced'
    };
}

async function unshift( _params ){

    const body = await getBody();
    db[_params.db][_params.table].unshift( body );

    modifyDB( _params.db,_params.table );
    return {
        database: _params.db,
        table: _params.table,
        status: 'unshifted'
    };
}

/* --------------------------------------------------------------------------------------- */

function addDB( _params ){

    const init = `${query.path}/_init_.json`;

    db._init_.DB.push({
        name: _params.db,
        tables: []
    });

    db[_params.db] = new Array(); 
    fs.writeFileSync( init,JSON.stringify(db._init_) );

    return {
        database: _params.db,
        status: 'DB added'
    };

}

function removeDB( _params ){

    const init = `${query.path}/_init_.json`;
    const i = db._init_.DB.findIndex(x=>{
        return x.name == _params.db
    }); 

    db._init_.DB[i].tables.forEach(x=>{
        const path = `${query.path}/${x}.json`;
        fs.unlinkSync(path);
    }); db._init_.DB.splice(i,1);

    db[_params.db] = new Array();
    fs.writeFileSync( init,JSON.stringify(db._init_) );

    return {
        database: _params.db,
        table: _params.table,
        status: 'DB deleted'
    };
    
}

function modifyDB( _name, _table ){

    const init = `${query.path}/_init_.json`;
    const path = `${query.path}/${_table}.json`;

    fs.writeFileSync( init,JSON.stringify(db._init_) );

    try {
        const length = db[_name][_table].length;
        if( length>0 ) encryptDB( _name, _table, path );
        else fs.writeFileSync( path,'' );
    } catch(e) { 
        fs.unlinkSync( path ); 
    }  

}

/* --------------------------------------------------------------------------------------- */

function addTable( _params ){

    if( db[_params.db][_params.table] )
    return {
        database: _params.db,
        table: _params.table,
        status: 'table exist'
    };

    const i = db._init_.DB.findIndex(x=>{
        return x.name == _params.db;
    }); db._init_.DB[i].tables.push(_params.table);

    db[_params.db][_params.table] = new Array();
    modifyDB( _params.db,_params.table );
    
    return {
        database: _params.db,
        table: _params.table,
        status: 'table added'
    };

}

function removeTable( _params ){

    const i = db._init_.DB.findIndex(x=>{
        return x.name == _params.db;
    }); 
    
    const j = db._init_.DB[i].tables.findIndex(x=>{
        return x == _params.table;
    });

    db._init_.DB[i].tables.splice(j,1);
    delete db[_params.db][_params.table];
    modifyDB( _params.db,_params.table );

    return {
        database: _params.db,
        table: _params.table,
        status: 'table removed'
    };

}

/* --------------------------------------------------------------------------------------- */

(async()=>{
    try{

        const api = url.parse( req.url,true );
        const params = api.query;

        /* Find Api */
        if( api.pathname == '/list' ) json( await list(params) )
        else if( api.pathname == '/hash' ) json( await hash(params) )
        else if( api.pathname == '/match' ) json( await match(params) )

        /* Remove Api */
        else if( api.pathname == '/pop' ) json( await pop(params) )
        else if( api.pathname == '/shift' ) json( await shift(params) )

        /* Modify Api */
        else if( api.pathname == '/push' ) json( await push(params) )
        else if( api.pathname == '/splice' ) json( await splice(params) )
        else if( api.pathname == '/unshift' ) json( await unshift(params) )

        /* Modify Table Api */
        else if( api.pathname == '/addDB' ) json( await addDB(params) )
        else if( api.pathname == '/removeDB' ) json( await removeDB(params) )

        /* Modify Table Api */
        else if( api.pathname == '/addTable' ) json( await addTable(params) )
        else if( api.pathname == '/removeTable' ) json( await removeTable(params) )

        else error('Oops something went wrong');

    } catch(e) { error(e); }
})();

/* --------------------------------------------------------------------------------------- */