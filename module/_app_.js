
const api = url.parse( req.url,true );
const query = process.mollyDB;
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

function parseData( _data, _length ){
    const length = _length||db[params.db][params.table].length;
    const pagination = Math.ceil(length/_data.length)||1;
    return {
        pagination: pagination,  
        database: params.db,
        table: params.table,
        length: length,
        status: 'OK',
        data: _data,
    }
}

function parseError( _e ){
    return {
        data: _e.message||_e,
        database: params.db,
        table: params.table,
        status: 'error',
    }
}

/* --------------------------------------------------------------------------------------- */

function bodyParser( _data ){
    try{
        const date = Date.now(); _data = JSON.parse(_data);
        const result = _data.length ? _data : [_data];
        return result.map(x=>{ if( !x?.hash )
            x.hash = crypto.hash( date,Math.random() );
            return JSON.stringify(x);
        });
    } catch(e) { return false }
}

function getBody(){
    return new Promise((response,reject)=>{
        try{
            if( req.method == 'POST' || (/push|unshift|splice|update/).test(api.pathname) ){
                const data = new Array();
                req.on('data',(chunk)=>{ data.push(chunk); });
                req.on('close',()=>{ try{
                    const buff = Buffer.concat(data);   
                    response( bodyParser(buff) ); 
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

        if( !(/table|db|all/gi).test(parse.pathname) ){
            validator = [
                [!vdb(_params?.db), {status:'error',message:`no db called ${_params.db} exist`}],
                [!vtb(_params?.table), {status:'error',message:`no table called ${_params.table} exist`}]
            ].some(x=>{ if(x[0]) reject(x[1]); return x[0];}); if(validator) return 0;
        }

        response(_params);

    });
}

/* --------------------------------------------------------------------------------------- */

function refresh( _params ){
    return new Promise((response,reject)=>{
        _init_().then(()=>{ response([{status: 'done'}]) })
        .catch((e)=>{ reject([{status:'error',message:e.message}]) });
    });
}

async function save( _params ){
    await modifyDB( _params.db,_params.table );
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

        else if( api.pathname == '/index' ) json( await indexOf(params) )
        else if( api.pathname == '/length' ) json( await lengthOf(params) )

        /* Save Api */
        else if( api.pathname == '/save' ) json( await save(params) )
        else if( api.pathname == '/remove' ) json( await remove(params) )
        else if( api.pathname == '/refresh' ) json( await refresh(params) )
        else if( api.pathname == '/saveAll' ) json( await saveAll(params) )

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

        else error(parseError('Oops something went wrong'));

    } catch(e) { error(parseError(e)); }
})();

/* --------------------------------------------------------------------------------------- */
