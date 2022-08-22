
const api = url.parse( req.url,true );
let params = api.query;
let body = undefined;
let parse = api;

/* --------------------------------------------------------------------------------------- */

function error( _error ){
    res.writeHead(404,{'contetn-type':'application/json'});
    res.end(JSON.stringify([{ status:'error', message:_error }]));
    console.log( _error,req.url );
}

function json( _data ){
    res.writeHead(200,{'content-type':'application/json'});
    res.end(JSON.stringify(_data));
}

/* --------------------------------------------------------------------------------------- */

function bodyParser( _data ){

    const date = Date.now();
    const result = new Array();

    if( typeof _data.length == 'number' ){
        for( var i in _data ){
            if(!_data[i]?.hash)
                _data[i].hash = crypto.hash( date,0 );
            result.push(JSON.stringify(_data[i]));
        }
    } else {
        if(!_data?.hash)
            _data.hash = crypto.hash( date,0 );
        result.push(JSON.stringify(_data));
    }   return result;

}

function getBody(){
    return new Promise((response,reject)=>{
        try{
            if( req.method == 'POST' || (/push|unshift|splice|update/).test(api.pathname) ){
                const data = new Array();
                req.on('data',(chunk)=>{ data.push(chunk); });
                req.on('close',()=>{ try{
                    const buff = Buffer.concat(data);
                    const json = JSON.parse(buff);                   
                    response( bodyParser(json) ); 
                } catch(e) { response(false) } });
            } else { response(true) }
        } catch(e) { response(false) } 
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

function validate( _params ){
    return new Promise((response,reject)=>{

        let validator = false;

        const vdb = (key)=>{ return db._init_.DB.some(x=>{ return x.name == key; }) }
        const vtb = (key)=>{ return db._init_.DB.some(x=>{ return x.tables.join().match(key); }) }

        validator = [
            [ !_params?.offset, '_params.offset = 0' ],
            [ !_params?.target, '_params.target = ""' ],
            [ !_params?.length, '_params.length = 100' ],
        ].every(x=>{ if(x[0]) eval(x[1]); return true; });

        validator = [
            [!body, {status:'error',message:'invalid data'}],
            [!_params?.db, {status:'error',message:'no db name added'}],
            [!_params?.table, {status:'error',message:'no table name added'}]
        ].some(x=>{ if(x[0]) reject(x[1]); return x[0];}); if(validator) return 0;

        if( !(/table|db/gi).test(parse.pathname) ){
            validator = [
                [!vdb(_params?.db), {status:'error',message:`no db called ${_params.db} exist`}],
                [!vtb(_params?.table), {status:'error',message:`no table called ${_params.table} exist`}]
            ].some(x=>{ if(x[0]) reject(x[1]); return x[0];}); if(validator) return 0;
        }

        response(_params);

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
    const result = db[_params.db][_params.table].shift(); save( _params ); return result;
}

function pop( _params ){ 
    const result = db[_params.db][_params.table].pop(); save( _params ); return result; 
}

/* --------------------------------------------------------------------------------------- */

async function push( _params ){

    db[_params.db][_params.table].push( ...body );

    save( _params ); return [{
        database: _params.db,
        table: _params.table,
        status: 'pushed'
    }];

}

async function splice( _params ){

    db[_params.db][_params.table].splice(
        _params.offset,_params.length,...body
    );

    save( _params ); return [{
        database: _params.db,
        table: _params.table,
        status: 'spliced'
    }];
}

async function unshift( _params ){

    db[_params.db][_params.table].unshift( ...body );

    save( _params ); return [{
        database: _params.db,
        table: _params.table,
        status: 'unshifted'
    }];
}

/* --------------------------------------------------------------------------------------- */

async function update( _params ){

    const index = db[_params.db][_params.table].findIndex(x=>{ 
        const regex = new RegExp(_params.target,'gi');
        return regex.test(x);
    });

    if( !(index<0) ) 
        db[_params.db][_params.table].splice( index,1,...body );

    save( _params ); return [{
        database: _params.db,
        table: _params.table,
        status: 'udated'
    }];
}

async function remove( _params ){

    const index = db[_params.db][_params.table].findIndex(x=>{ 
        const regex = new RegExp(_params.target,'gi');
        return regex.test(x);
    });

    if( !(index<0) )
        db[_params.db][_params.table].splice( index,1 );

    save( _params ); return [{
        database: _params.db,
        table: _params.table,
        status: 'removed'
    }];
}

/* --------------------------------------------------------------------------------------- */

function addDB( _params ){
    try{

        db._init_.DB.push({
            tables: [],
            name: _params.db,
        }); db[_params.db] = new Array(); 
    
        save( _params ); return [{
            database: _params.db,
            status: 'DB added'
        }];

    } catch(e) {  }
}

function removeDB( _params ){
    try{

        const i = db._init_.DB.findIndex(x=>{
            return x.name == _params.db
        }); 
    
        db._init_.DB[i].tables.forEach(x=>{
            const path = `${query.path}/${x}.json`;
            fs.unlinkSync(path);
        }); db._init_.DB.splice(i,1);
        db[_params.db] = new Array();
    
        save( _params ); return [{
            database: _params.db,
            table: _params.table,
            status: 'DB deleted'
        }];

    } catch(e) {  }
}

function modifyDB( _name, _table ){
    try{

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

    } catch(e) {  }
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
    
    save( _params ); return [{
        database: _params.db,
        table: _params.table,
        status: 'table added'
    }];

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

    save( _params ); return [{
        database: _params.db,
        table: _params.table,
        status: 'table removed'
    }];

}

/* --------------------------------------------------------------------------------------- */

function refresh( _params ){
    return new Promise((response,reject)=>{
        _init_().then(()=>{ response([{status: 'done'}]) })
        .catch((e)=>{ reject([{status:'error',message:e.message}]) });
    });
}

function save( _params ){
    modifyDB( _params.db,_params.table );
    return [{
        database: _params.db,
        table: _params.table,
        status: 'saved'
    }];
}

/* --------------------------------------------------------------------------------------- */

(async ()=>{
    try{
        
        body = await getBody();
        params = await validate(params); 

        /* Find Api */
        if( api.pathname == '/list' ) json( await list(params) )
        else if( api.pathname == '/hash' ) json( await hash(params) )
        else if( api.pathname == '/match' ) json( await match(params) )
        else if( api.pathname == '/update' ) json( await update(params) )

        /* Save Api */
        else if( api.pathname == '/save' ) json( await save(params) )
        else if( api.pathname == '/remove' ) json( await remove(params) )
        else if( api.pathname == '/refresh' ) json( await refresh(params) )

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

    } catch(e) { error(e?.message||e); }
})();

/* --------------------------------------------------------------------------------------- */