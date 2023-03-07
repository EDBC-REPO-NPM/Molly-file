/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

const crypto = require('./crypto_handler');
const init = require('./init_handler');
const path = require('path');
const output = new Object();
const fs = require('fs');

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

output.validator = function( db, params ){
    return new Promise((response,reject)=>{

        let validator = false; output.bodyParser( params );
        const vdb = ()=>db._init_.DB.some(x=>x.name==params.db);
        const vtb = ()=>db._init_.DB.some(x=>x.tables?.join().match(params.table));

        validator = [
            [ !params?.offset, 'params.offset = 0' ],
            [ !params?.db,     'params.db = "test"' ],
            [ !params?.target, 'params.target = ""' ],
            [ !params?.length, 'params.length = 100' ],
            [ !params?.table,  'params.table = "test"' ],
        ].every(x=>{ if(x[0]) eval(x[1]); return true; });

        validator = [
            [!params?.db, {status:404,message:'error: no db name added'}],
            [!params?.table, {status:404,message:'error: no table name added'}],
        ].some(x=>{ if(x[0]) response([0,x[1]]); return x[0];}); if(validator) return 0;

        validator = [
            [!vdb(), output.addDB(params,db)], 
            [!vtb(), output.addTable(params,db)], 
        ].some(x=>x[0]); response([1,'']);

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

output.tableList = function( data,db ){
    const result = Object.keys(db[data.db]);
    return parseData( db,data,result );
}
/*
output.dbList = function( data,db ){
    const result = Object.keys(db);
    return parseData( db,data,result );
}
*/
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
            if( db._init_.DB[i].name == data.db ){
                db._init_.DB[i].tables.map(x=>{
                    const dir = path.join(data.path,`${x}.json`);
                    if( fs.existsSync(dir) ) fs.unlinkSync(dir);
                }); 
                const arr = db._init_.DB; arr.splice(i,1);
                      db._init_.DB = arr||new Array(); 
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
                const dir = path.join(data.path,`${data.table}.json`);
                const j = db._init_.DB[i].tables.indexOf(data.table);
                if( fs.existsSync(dir) ) fs.unlinkSync(dir);
                const arr = db._init_.DB[i].tables; arr.splice(j,1);
                      db._init_.DB[i].tables = arr||new Array(); 
                delete db[data.db][data.table];
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

output.checkAll = async function(data,db){
    try { for( let i in db['_init_'] ){ for( let j in db['_init_'][i] ){
        const { name, tables } = db['_init_'][i][j]; 
        for( let tbl of tables ) for( let i in db[name][tbl] ) {
            fs.unlinkSync( db[name][tbl][i].headers['x-molly-path'] );
            delete db[name][tbl][i];
        }
    }} return { 
        status: 200,
        database: data.db,
        table: data.table,
        message: 'DB Saved' 
    }} catch(e) { return parseError(db,data,e) }
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = output;