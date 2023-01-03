/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

const crypto = require('./crypto_handler');
const path = require('path');
const output = new Object();
const fs = require('fs');

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

output.validator = function( db, params ){
    return new Promise((response,reject)=>{

        let validator = false; output.bodyParser( params );
        const vdb = (key)=>{ return db._init_.DB.some(x=>{ return x.name == key; }) }
        const vtb = (key)=>{ return db._init_.DB.some(x=>{ return x.tables.join().match(key); }) }

        validator = [
            [ !params?.offset, 'params.offset = 0' ],
            [ !params?.target, 'params.target = ""' ],
            [ !params?.length, 'params.length = 100' ],
        ].every(x=>{ if(x[0]) eval(x[1]); return true; });

        validator = [
            [!params?.db, {status:404,message:'error: no db name added'}],
            [!params?.table, {status:404,message:'error: no table name added'}]
        ].some(x=>{ if(x[0]) reject(x[1]); return x[0];}); if(validator) return 0;

        if( !(/table|db|all/gi).test(params.type) ){
            validator = [
                [!vdb(params?.db), {status:404,message:`erorr: no db called ${params.db} exist`}],
                [!vtb(params?.table), {status:404,message:`error: no table called ${params.table} exist`}]
            ].some(x=>{ if(x[0]) reject(x[1]); return x[0];}); if(validator) return 0;
        }

        response();
    });
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

const encryptDB = function( param, db, _db, _table, _path ){
    return new Promise((response,reject)=>{
        const writable = fs.createWriteStream( _path+'_tmp' );
        for( var i in db[_db][_table] ){
    
            const data = db[_db][_table][i];
            const ecrp = crypto.encrypt( data,param.pass );
    
            writable.write(`${ecrp}\n`);
        }   writable.end();
    
        writable.on('error',(e)=>reject(e));
        writable.on('close',()=>{ 
            fs.renameSync( _path+'_tmp', _path ); 
            response('done');
        });

    });
}

const modifyDB = async function( data, db, _name, _table ){
    try{

        const dir = path.join(db._path_,`${_table}.json`);
        const init = path.join(db._path_,'_init_.json');

        fs.writeFileSync( init,JSON.stringify(db._init_) );
    
        try{const length = db[_name][_table].length;
            if( !(length>0) ) fs.writeFileSync(dir,'');
            else await encryptDB( data, db, _name, _table, dir );
        } catch(e) { console.log(e); fs.unlinkSync( dir ); }

    } catch(e) { console.log(e); return parseError(db,data,e) }
}

const parseData = function( db,params,_data, _length ){
    const length = _length||db[params.db][params.table].length;
    const pagination = Math.ceil(length/_data.length)||1;
    return {
        status: 200, data: _data, 
        length: length, table: params.table,
        pagination: pagination, database: params.db,
    }
}

output.bodyParser = function( data ){
    try{const date = Date.now(); const {body} = data;
        const result = Array.isArray(body) ? body : [body];
        data.body = result.map(x=>{ if( !x?.hash )
            x.hash = crypto.hash( date,Math.random() );
            return JSON.stringify(x);
        });
    } catch(e) { }
}

const parseError = function( db,params,_e ){
    return {
        status: 404,
        table: params.table,
        database: params.db,
        data: _e.message||_e,
    }
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

output.pop = function(data,db){ db._update_ = true;
    const result = db[data.db][data.table].pop();
    return parseData( db,data,result );
}
output.shift = function(data,db){ db._update_ = true;
    const result = db[data.db][data.table].shift();
    return parseData( db,data,result );
}
output.slice = function(data,db){
    const result = db[data.db][data.table].slice(...data.args);
    return parseData( db,data,result );
}

/*-- ── --*/

output.push = function( data,db ){ db._update_ = true;
    const result = db[data.db][data.table].push(...data.body);
    return parseData( db,data,result );
}

output.unshift = function( data,db ){ db._update_ = true;
    const result = db[data.db][data.table].unshift(...data.body);
    return parseData( db,data,result );
}

/*-- ── --*/

output.list = function(data,db){
    try{return parseData( db,data,
            db[data.db][data.table].slice(
                data.offset, Number(data.offset) + Number(data.length)
            ).map(x=> JSON.parse(x) )
        );
    } catch(e) { return parseError(db,data,e) }
}

output.hash = function(data,db){ 
    try{const result = new Array();
        db[data.db][data.table].map((x)=>{
            const regex = new RegExp(data.target,'gi');
            if( regex.test(x) ) result.push(x);
        });
        return parseData( db,data,
            result.map(x=>JSON.parse(x)).slice(
                data.offset, Number(data.offset) + Number(data.length)
            ),  result.length);
    } catch(e) { return parseError(db,data,e) }
}

output.match = function(data,db){ 
    try{const result = new Array();
        db[data.db][data.table].map((x)=>{
            const reg = crypto.slugify(data.target);
            const regex = new RegExp(reg,'gi');
            const target = crypto.slugify(x);
            if( regex.test(target) ) result.push(x);
        });
        return parseData( db,data,
            result.map(x=>JSON.parse(x)).slice(
                data.offset, Number(data.offset) + Number(data.length)
            ),  result.length);
    } catch(e) { return parseError(db,data,e) }
}

/*-- ── --*/

output.update = function(data,db){ 
    try { db._update_ = true;
        for( var i in db[data.db][data.table] ){
            const regex = new RegExp(data.target,'gi');
            if( regex.test(db[data.db][data.table][i]) )
                return db[data.db][data.table].splice(i,1,...data.body);
        }
    } catch(e) { return parseError(db,data,e) }
}

output.remove = function(data,db){ 
    try{ db._update_ = true;
        for( var i in db[data.db][data.table] ){
            const regex = new RegExp(data.target,'gi');
            if( regex.test(db[data.db][data.table][i]) )
                return db[data.db][data.table].splice(i,0);
        }
    } catch(e) { return parseError(db,data,e) }
}

/*-- ── --*/

output.addDB = function(data,db){ 
    try{db._update_ = true;

        if( db[data.db] ) return {
            status: 404,
            database: data.db,
            table: data.table,
            message: 'DB already exist'
        };
        
        db._init_.DB.push({ 
            tables: [], name: data.db,
        }); db[data.db] = new Array();
    
        return {
            status: 200,
            message: 'DB added',
            database: data.db,
        };

    } catch(e) { return parseError(db,data,e) }
}

output.removeDB = function(data,db){ 
    try{

        if( !db[data.db] ) return {
            status: 404,
            database: data.db,
            table: data.table,
            message: 'DB does not exist',
        };

        for( var i in db._init_.DB ){
            if( db._init_.DB.name == data.db ){
                db._init_.DB[i].tables.map(x=>{
                    fs.unlinkSync(path.join(data.path,`${x}.json`));
                }); db._init_.DB.splice(i,1);
                delete db[data.db];
                break;
            }
        }
    
        return {
            status: 200,
            database: data.db,
            table: data.table,
            message: 'DB deleted'
        };

    } catch(e) { return parseError(db,data,e) }    
}

output.addTable = function(data,db){ 
    try{db._update_ = true;
        
        if( db[data.db][data.table] ) return {
            status: 404,
            database: data.db,
            table: data.table,
            message: 'table already exist',
        };
    
        for( var i in db._init_.DB ){
            if( db._init_.DB[i].name == data.db ){
                db[data.db][data.table] = new Array();
                db._init_.DB[i].tables.push(data.table);
                break;
            }
        }
        
        return {
            status: 200,
            database: data.db,
            table: data.table,
            message: 'table added'
        };

    } catch(e) { return parseError(db,data,e) }
}

output.removeTable = function(data,db){
    try{db._update_ = true;

        if( !db[data.db][data.table] ) return {
            status: 404,
            database: data.db,
            table: data.table,
            message: 'table does not exist'
        };
    
        for( var i in db._init_.DB ){
            if( db._init_.DB[i].name == data.db ){
                const j = db._init_.DB[i].tables.indexOf(x=>x==data.table);
                delete db[data.db][data.table]; db._init_.DB[i].tables.splice(j,1);
                break;
            }
        }
    
        return {
            status: 200,
            database: data.db,
            table: data.table,
            message: 'table removed'
        };

    } catch(e) { return parseError(db,data,e) }
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

output.saveAll = async function(data,db){
    try { for( var i in db['_init_'] ){ for( var j in db['_init_'][i] ){
        const {name,tables} = db['_init_'][i][j];
        for( var k in tables ) await modifyDB(data,db,name,tables[k])
    }} return { 
        status: 200,
        database: data.db,
        table: data.table,
        message: 'DB Saved' 
    }} catch(e) { console.log(e); return parseError(db,data,e) }
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = output;