/* --------------------------------------------------------------------------------------- */

function list( _params ){
    try{return parseData( db[_params.db][_params.table].slice(
            _params.offset, Number(_params.offset)+Number(_params.length)
        ).map(x=>JSON.parse(x)));
    } catch(e) { return parseError(e) }
}

function match( _params ){
    try{
        const result = new Array();
        db[_params.db][_params.table].map((x)=>{
            const reg = crypto.slugify(_params.target);
            const regex = new RegExp(reg,'gi');
            const target = crypto.slugify(x);
            if( regex.test(target) ) result.push(x);
        });
        return parseData( result.map(x=>JSON.parse(x)).slice(
            _params.offset, Number(_params.offset)+Number(_params.length)
        ), result.length);
    } catch(e) { return parseError(e) }
}

function hash( _params ){
    try{const result = new Array();
        db[_params.db][_params.table].map((x)=>{
            const regex = new RegExp(_params.target,'gi');
            if( regex.test(x) ) result.push(x);
        });
        return parseData( result.map(x=>JSON.parse(x)).slice(
            _params.offset, Number(_params.offset)+Number(_params.length)
        ), result.length);
    } catch(e) { return parseError(e) }
}

/* --------------------------------------------------------------------------------------- */

async function unshift( _params ){ db._update_ = true;
    return parseData(db[_params.db][_params.table].unshift(...body)) 
}

async function push( _params ){ db._update_ = true;
    return parseData(db[_params.db][_params.table].push(...body)) 
}

async function shift( _params ){ db._update_ = true;
    return parseData(db[_params.db][_params.table].shift()) 
}

async function pop( _params ){ db._update_ = true;
    return parseData(db[_params.db][_params.table].pop()) 
}

/* --------------------------------------------------------------------------------------- */

async function update( _params ){
    try{db._update_ = true;
        for( var i in db[_params.db][_params.table] ){
            
            const regex = new RegExp(_params.target,'gi');
            if( regex.test(db[_params.db][_params.table][i]) )
                return db[_params.db][_params.table].splice(i,1,...body);

        }
    } catch(e) { return parseError(e) }
}

async function remove( _params ){
    try{db._update_ = true;
        for( var i in db[_params.db][_params.table] ){
            
            const regex = new RegExp(_params.target,'gi');
            if( regex.test(db[_params.db][_params.table][i]) )
                return db[_params.db][_params.table].splice(i,1);

        }
    } catch(e) { return parseError(e) }
}

/* --------------------------------------------------------------------------------------- */

async function addTable( _params ){
    try{db._update_ = true;
        
        if( db[_params.db][_params.table] ) return {
            status: 'table already exist',
            database: _params.db,
            table: _params.table,
        };
    
        for( var i in db._init_.DB ){
            if( db._init_.DB[i].name == _params.db ){
                db[_params.db][_params.table] = new Array();
                db._init_.DB[i].tables.push(_params.table);
                break;
            }
        }
        
        /*await save( _params )*/ return {
            status: 'table added',
            database: _params.db,
            table: _params.table,
        };

    } catch(e) { return parseError(e) }
}

async function removeTable( _params ){
    try{db._update_ = true;

        if( !db[_params.db][_params.table] ) return {
            status: 'table does not exist',
            database: _params.db,
            table: _params.table,
        };
    
        for( var i in db._init_.DB ){
            if( db._init_.DB[i].name == _params.db ){
                delete db[_params.db][_params.table];
                db._init_.DB[i].tables.splice(j,1);
                break;
            }
        }
    
        /*await save( _params )*/ return {
            status: 'table removed',
            database: _params.db,
            table: _params.table,
        };

    } catch(e) { return parseError(e) }
}

/* --------------------------------------------------------------------------------------- */

async function addDB( _params ){
    try{db._update_ = true;

        if( db[_params.db] ) return {
            status: 'DB already exist',
            database: _params.db,
            table: _params.table,
        };
        
        db._init_.DB.push({ 
            tables: [], name: _params.db,
        }); db[_params.db] = new Array();
    
        /*await save( _params )*/ return {
            database: _params.db,
            status: 'DB added'
        };

    } catch(e) { return parseError(e) }
}

async function removeDB( _params ){
    try{

        if( !db[_params.db] ) return {
            status: 'DB does not exist',
            database: _params.db,
            table: _params.table,
        };

        for( var i in db._init_.DB ){
            if( db._init_.DB.name == _params.db ){
                db._init_.DB[i].tables.map(x=>{
                    const path = `${query.path}/${x}.json`;
                    fs.unlinkSync(path);
                }); db._init_.DB.splice(i,1);
                delete db[_params.db];
                break;
            }
        }
    
        /*await save( _params )*/ return {
            database: _params.db,
            table: _params.table,
            status: 'DB deleted'
        };

    } catch(e) { return parseError(e) }
}

async function modifyDB( _name, _table ){
    try{

        const init = `${query.path}/_init_.json`;
        const path = `${query.path}/${_table}.json`;

        fs.writeFileSync( init,JSON.stringify(db._init_) );
    
        try{const length = db[_name][_table].length;
            if( !(length>0) ) fs.writeFileSync(path,'');
            else await encryptDB( _name, _table, path );
        } catch(e) { fs.unlinkSync( path ); }

    } catch(e) { return parseError(e) }
}

/* --------------------------------------------------------------------------------------- */

async function saveAll(){
    try{for( var i in db['_init_'] ){ for( var j in db['_init_'][i] ){
        const {name,tables} = db['_init_'][i][j];
        for( var k in tables ) 
            await modifyDB(name,tables[k])
    }}  return { status: 'DB Saved' };
    } catch(e) { console.log(e); return parseError(e) }
}