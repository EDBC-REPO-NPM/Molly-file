const readline = require('./readline');
const fs = require('fs');

//TODO: Optimization FUnctions -------------------------------------------------------------------//

const _default = { offset: 0, length: 100 };
const init = function( _table,_config,_self ){
	return {
		_tbl: createNewTable( `${_self.path}/${_table}.json` ),
		_tmp: `${_self.path}/${_table}_tmp.json`,
		_path: `${_self.path}/${_table}.json`,
		_cfg: config(_config),
	}
};

const createNewTable = function( _path ){
	if( !fs.existsSync( _path ) ) fs.writeFileSync( _path,"" );
	const table = fs.createReadStream( _path );
	return table; 
}

const createNewHash = function( _object ){
	_object['_stamp'] = Date.now();
	const _base = JSON.stringify( _object );
	if( !_object.hash )
		_object.hash = crypto.SHA256( _base ).toString();
	return _object;
}

function config(_config){
    Object.keys(_config).map((x)=>{
        _default[x] = _config[x];
    }); return _default;
}

//TODO: localDB Class ----------------------------------------------------------------------------//

class localDB {

	default = { offset: 0, length: 100 }

	constructor( _object ){
		if( _object.pass ){
			this.password = _object.pass;
		} 	this.path = _object.path;
	}

	// TODO: Searching functions --------------------------------------------------- //
	list( _table, _config ){
		return new Promise( async(response,reject)=>{ try{
			const { _cfg,_tbl,_tmp,_path } = init( _table,_config,this );
			let data = await readline.list( this,_tbl,_cfg );
				data = data.map(x=>{ return JSON.parse(x) });
			response({ data:data, table:_table });
		} catch(e) { reject(e); }}); 
	}

	find( _table, _target, _config ){
		return new Promise( async(response,reject)=>{ try{
			const { _cfg,_tbl,_tmp,_path } = init( _table,_config,this );
			let data = await readline.find( this,_tbl,_target,_cfg );
				data = data.map(x=>{ return JSON.parse(x) });
			response({ data:data, table:_table });
		} catch(e) { reject(e); }}); 
	}

	match( _table,_match,_config ){
		return new Promise( async(response,reject)=>{ try{
			const { _cfg,_tbl,_tmp,_path } = init( _table,_config,this );
			let data = await readline.match( this,_tbl,_match );
				data = data.map(x=>{ return JSON.parse(x) });
			response({ data:data, table:_table });
		} catch(e) { reject(e); }}); 
	}

	hash( _table, _hash ){
		return new Promise( async(response,reject)=>{ try{
			const { _cfg,_tbl,_tmp,_path } = init( _table,null,this );
			let data = await readline.hash( this,_tbl,_hash,_cfg );
				data = data.map(x=>{ return JSON.parse(x) });
			response({ data:data, table:_table });
		} catch(e) { reject(e); }}); 
	}

	// TODO: Saving functions ------------------------------------------------- //
	push( _table, ..._object ){
		return new Promise( (response,reject)=>{ try{
			
			let { _i,_cfg,_itr,_res,_tmp,_path } = init( _table,null,this );
			const writable = fs.createWriteStream( _tmp );

			_itr.on( 'line',( line )=>{ writable.write(`${line}\n`); });

			_itr.on( 'close',()=>{
				_object.flat().forEach( item=>{
					item = createNewHash( item );
					const encryptedData = this.encrypt( JSON.stringify( item ) );
					writable.write( `${encryptedData}\n` );
				}); writable.end();
			});

			writable.on( 'finish',()=>{ fs.renameSync( _tmp, _path ); res({
				table: _table,
			}); });

		} catch(e) { reject(e); }
	}); }

	unshift( _table, ..._object ){
		return new Promise( (response,reject)=>{ try{
			
			let { _i,_cfg,_itr,_res,_tmp,_path } = init( _table,null,this );
			const writable = fs.createWriteStream( _tmp );
			
			_itr.on( 'line',( line )=>{ 
				if( _i == 0 ){
					_object.flat().forEach( item=>{
						item = createNewHash( item );
						const encryptedData = this.encrypt( JSON.stringify( item ) );
						writable.write( `${encryptedData}\n` );
					});
				} 	writable.write( `${line}\n` ); 
			_i++;});
			
			_itr.on( 'close',()=>{ writable.end(); });

			writable.on( 'finish',()=>{ fs.renameSync( _tmp, _path ); res({
				table: _table,
			}); });

		} catch(e) { reject(e) }
	}); }

	place( _table, _line, ..._object ){
		return new Promise( (response,reject)=>{ try{

			let { _i,_cfg,_itr,_res,_tmp,_path } = init( _table,null,this );
			const writable = fs.createWriteStream( _tmp );
			
			_itr.on( 'line',( line )=>{ 
				if( _i == _line ){
					_object.flat().forEach( item=>{
						item = createNewHash( item );
						const encryptedData = this.encrypt( JSON.stringify( item ) );
						writable.write( `${encryptedData}\n` );
					});
				} 	writable.write( `${line}\n` ); 
			_i++;});
			
			_itr.on( 'close',()=>{ writable.end(); });

			writable.on( 'finish',()=>{ fs.renameSync( _tmp, _path ); res({
				table: _table,
			}); });

		} catch(e) { reject(e) }
	}); }

	update( _table, _hash, ..._object ){
		return new Promise( (response,reject)=>{ try{

			let { _i,_cfg,_itr,_res,_tmp,_path } = init( _table,null,this );
			const writable = fs.createWriteStream( _tmp );

			_itr.on( 'line',( encryptedLine )=>{ try{
				const line = this.decrypt( encryptedLine );
				const data = JSON.parse( line );
				if( data.hash == _hash ){
					_object.flat().forEach( item=>{
					item = createNewHash( item );
						const encryptedData = this.encrypt( JSON.stringify( item ) );
						writable.write( `${encryptedData}\n` );
					});
				} else
					writable.write( `${encryptedLine}\n` ); 
			} catch(e) { reject(`the db can be decripted: ${e}`) }
			});
			
			_itr.on( 'close',()=>{ writable.end(); });

			writable.on( 'finish',()=>{ fs.renameSync( _tmp, _path ); res({
				table: _table,
			}); });

		} catch(e) { reject(e) }
	}); }

	// TODO: Removing functions //
	remove( _table, _hash ){
		return new Promise( (response,reject)=>{ try{

			let { _i,_cfg,_itr,_res,_tmp,_path } = init( _table,null,this );
			const writable = fs.createWriteStream( _tmp );
			
			_itr.on( 'line',( encryptedLine )=>{
				const line = this.decrypt( encryptedLine );
				const data = JSON.parse( line );
				if( data.hash != _hash ) 
					writable.write( `${encryptedLine}\n` ); 
			});
			
			_itr.on( 'close',()=>{ writable.end(); });

			writable.on( 'finish',()=>{ fs.renameSync( _tmp, _path ); res({
				table: _table,
			}); });

		} catch(e) { reject(e) }
	}); }

	removeTable( _table ){
		return new Promise( (response,reject)=>{
			const _path = `${this.path}/${_table}`;
			fs.unlink( _path,( err,data )=>{
				if(err) reject( err );
				res({ table: _table });
			});
		})
	}

	shift( _table ){
		return new Promise( (response,reject)=>{ try{

			let { _i,_cfg,_itr,_res,_tmp,_path } = init( _table,null,this );
			const writable = fs.createWriteStream( _tmp );

			_itr.on( 'line',( line )=>{ if( _i != 0 ) writable.write( `${line}\n` ); _i++;});

			_itr.on( 'close',()=>{ writable.end(); });

			writable.on( 'finish',()=>{ fs.renameSync( _tmp, _path ); res({
				table: _table,
			}); });

		} catch(e) { reject(e) }
	}); }

}

//TODO: localDB Class ----------------------------------------------------------------------------//
module.exports = localDB;
