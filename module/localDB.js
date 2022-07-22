const readline = require('readline');
const crypto = require('crypto-js');
const fs = require('fs');

//TODO: Function ---------------------------------------------------------------------------------//
function slugify(str){ 
	const map = {
		'o' : 'ó|ò|ô|õ|ö|Ó|Ò|Ô|Õ|Ö',
		'a' : 'á|à|ã|â|ä|À|Á|Ã|Â|Ä',
	   	'e' : 'é|è|ê|ë|É|È|Ê|Ë',
	   	'i' : 'í|ì|î|ï|Í|Ì|Î|Ï',
	   	'u' : 'ú|ù|û|ü|Ú|Ù|Û|Ü',
		'c' : 'ç|Ç','n':'ñ|Ñ',
		''  : /\s+|\W+/,
	};	
	for (var pattern in map) { 
		str=str.replace( new RegExp(map[pattern],'gi' ), pattern); 
	}	return str.toLowerCase();
}

const JsonFormatter = {
	'stringify': function(cipherParams) {
    	var jsonObj = { ct: cipherParams.ciphertext.toString(crypto.enc.Base64) };
    	if (cipherParams.salt) jsonObj.s = cipherParams.salt.toString();
	    if (cipherParams.iv) jsonObj.iv = cipherParams.iv.toString(); 
	    return new Buffer(JSON.stringify(jsonObj)).toString('base64');
  	},

  	'parse': function(jsonStr) {
    	var jsonObj = JSON.parse( new Buffer(jsonStr,'base64').toString('UTF-8'));
    	var cipherParams = crypto.lib.CipherParams.create({
     	 	ciphertext: crypto.enc.Base64.parse(jsonObj.ct)
    	});
    	if (jsonObj.iv) cipherParams.iv = crypto.enc.Hex.parse(jsonObj.iv);
    	if (jsonObj.s) cipherParams.salt = crypto.enc.Hex.parse(jsonObj.s);
    	return cipherParams;
 	}
};

//TODO: Optimization FUnctions -------------------------------------------------------------------//

const init = function( _table,_config,_self ){
	return {
		_i: 0,
		_res: new Array(),
		_path: `${_self.path}/${_table}.json`,
		_tmp: `${_self.path}/${_table}_tmp.json`,
		_cfg: !_config ? _self.default : _config,
		_itr: readline.createInterface( createNewTable( `${_self.path}/${_table}.json` ) ),
	}
};

const lineConstrain = function( _i,_config ){
	if( _i >= parseInt(_config.length)+parseInt(_config.offset) ) return 1;
	else if ( _i < parseInt(_config.offset) ) return -1
	else return 0;
}

const createNewTable = function( _path ){
	if( !fs.existsSync( _path ) ) fs.writeFileSync( _path,"" );
	const table = fs.createReadStream( _path );
	return { debug: false, input: table }; 
}

const createNewHash = function( _object ){
	_object['_stamp'] = Date.now();
	const _base = JSON.stringify( _object );
	if( !_object.hash )
		_object.hash = crypto.SHA256( _base ).toString();
	return _object;
}

//TODO: localDB Class ----------------------------------------------------------------------------//

class localDB{

	encrypted = false
	events = new Object()
	default = { offset: 0, length: 100 }

	constructor( _path, _password ){
		if( _password ){
			this.password = _password;
			this.encrypted = true;
		} 	this.path = _path;
	}

	// TODO: Encription & Decription DATA //
	encrypt( _message,_password=this.password,_encrypted=this.encrypted ){ 
		try{
			if( _encrypted )
			return crypto.AES.encrypt( _message,_password,{
				format: JsonFormatter
			}).toString(); return _message;
		} catch(e) { return _message; }
	}
	
	decrypt( _message,_password=this.password,_encrypted=this.encrypted ){ 
		try{
			if( _encrypted )
			return crypto.AES.decrypt( _message,_password,{
					format: JsonFormatter
				}).toString(  crypto.enc.Utf8 );
			return _message;
		} catch(e) { return _message; }
	}

	// TODO: Searching functions //
	list( _table, _config ){
		return new Promise( (res,rej)=>{ try{

			let { _i,_cfg,_itr,_res,_tmp,_path } = init( _table,_config,this );

			_itr.on( 'line',( encryptedLine )=>{ try{
				const line = this.decrypt( encryptedLine );
				const cns = lineConstrain( _i, _cfg );
				if( cns == 0 ) { _res.push( JSON.parse( line ) );
				} else if( cns == 1 ) _itr.close(); 
			} catch(e) { rej(`the db can be decripted: ${e}`) }
			_i++; });

			_itr.on( 'close',()=>{ res({
				table:_table,
				data:_res,
			}); });

		} catch(e) { rej( e ); } }); 
	}

	on( _event, _callback ){ this.events[_event] = _callback; }
	loop( _table ){
		return new Promise( (res,rej)=>{ try{
			
			let { _i,_cfg,_itr,_res,_tmp,_path } = init( _table,null,this );
			if( this.events.start ) this.events.start( _itr );

			_itr.on( 'line',( encryptedLine )=>{ try{
					const line = this.decrypt( encryptedLine );
					if( this.events.data ) this.events.data( line,_i,_itr );
				} catch(e) { rej(`the db can be decripted: ${e}`) }
			_i++; });

			_itr.on( 'close',()=>{ 
				if( this.events.close ) this.events.close( _itr );
			});

		} catch(e) { rej( e ); } }); 
	}

	find( _table, _target, _logic='AND', _config ){
		return new Promise( async(res,rej)=>{ try{

			let { _i,_cfg,_itr,_res } = await init( _table,_config,this );

			_itr.on( 'line',( encryptedLine )=>{ 
				try{
					const line = this.decrypt( encryptedLine );
					const keys = Object.keys( _target );
					const data = JSON.parse( line );

					const regex = ( x )=>{
						const target = slugify(_target[x].toString());
						const info = slugify(data[x].toString());
						const regex = new RegExp(target,'gi');
						return regex.test(info);
					}

					const every = keys.every( (x)=>{return regex(x)} );
					const some = keys.some( (x)=>{return regex(x)} );

					if( ( (/AND/gi).test(_logic) && every ) || ( (/OR/gi).test(_logic) && some ) ){
						const cns = lineConstrain( _i, _cfg );
						if( cns == 0 ) _res.push( data );
						else if( cns == 1 ) _itr.close(); 
					_i++;}

				} catch(e) { rej(`the db can be decripted: ${e}`) }
			});

			_itr.on( 'close',()=>{ res({
				table:_table,
				data:_res,
			}); });

		} catch(e) { rej( e ); } }); 
	}

	match( _table,_match,_config ){
		return new Promise( async(res,rej)=>{ try{

			let { _i,_cfg,_itr,_res } = await init( _table,_config,this );

			_itr.on( 'line',( encryptedLine )=>{ try{
				const regex = new RegExp(slugify(_match),'gi');
				const line = this.decrypt( encryptedLine );
				if( regex.test(slugify(line)) ){
					const cns = lineConstrain( _i, _cfg );
					if( cns == 0 ) _res.push( JSON.parse( line ) );
					else if( cns == 1 ) _itr.close(); 
				_i++;}
			} catch(e) { rej(`the db can be decripted: ${e}`) }	
			});

			_itr.on( 'close',()=>{ res({
				table:_table,
				data:_res,
			}); });

		} catch(e) { rej( e ); } }); 
	}

	findByHash( _table, _hash ){
		return new Promise( (res,rej)=>{ try{
			
			let { _i,_cfg,_itr,_res,_tmp,_path } = init( _table,null,this );

			_itr.on( 'line',( encryptedLine )=>{ try{
				const line = this.decrypt( encryptedLine );
				const data = JSON.parse( line );
				if( data.hash == _hash ){
					_res.push( data );
					_itr.close();
				}
			} catch(e) { rej(`the db can be decripted: ${e}`) }
			});

			_itr.on( 'close',()=>{ res({
				table:_table,
				data:_res,
			}); });

		} catch(e) { rej( e ); } }); 
	}

	// TODO: Saving functions //
	encryptTable( _table,_password ){
		return new Promise( (res,rej)=>{ try{
			
			let { _i,_cfg,_itr,_res,_tmp,_path } = init( _table,null,this );
			const writable = fs.createWriteStream( _tmp );

			writable.on( 'finish',()=>{ fs.renameSync( _tmp, _path ); res(); });

			_itr.on( 'line',( encryptedLine )=>{ 
				try{
					const line = this.decrypt( encryptedLine );
					const encryptedData = this.encrypt( line,_password,true );
					writable.write( `${encryptedData}\n` );
				} catch(e) { rej(`the db can be decripted ${e}`) }
			});

			_itr.on( 'close',()=>{ writable.end(); res({
				table: _table,
			}); });

		} catch(e) { rej( e ); } }); 
	}

	decryptTable( _table ){
		return new Promise( (res,rej)=>{ try{
			
			let { _i,_cfg,_itr,_res,_tmp,_path } = init( _table,null,this );
			const writable = fs.createWriteStream( _tmp );

			writable.on( 'finish',()=>{ fs.renameSync( _tmp, _path ); res(); });
			_itr.on( 'line',( encryptedLine )=>{ 
				try{
					const line = this.decrypt( encryptedLine );
					writable.write( `${line}\n` );

				} catch(e) { rej(`the db can be decripted: ${e}`) }
			});

			_itr.on( 'close',()=>{ writable.end(); res({
				table: _table,
			}); });

		} catch(e) { rej( e ); } }); 
	}

	// TODO: Saving functions //
	push( _table, ..._object ){
		return new Promise( (res,rej)=>{ try{
			
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

		} catch(e) { rej(e); }
	}); }

	unshift( _table, ..._object ){
		return new Promise( (res,rej)=>{ try{
			
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

		} catch(e) { rej(e) }
	}); }

	place( _table, _line, ..._object ){
		return new Promise( (res,rej)=>{ try{

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

		} catch(e) { rej(e) }
	}); }

	update( _table, _hash, ..._object ){
		return new Promise( (res,rej)=>{ try{

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
			} catch(e) { rej(`the db can be decripted: ${e}`) }
			});
			
			_itr.on( 'close',()=>{ writable.end(); });

			writable.on( 'finish',()=>{ fs.renameSync( _tmp, _path ); res({
				table: _table,
			}); });

		} catch(e) { rej(e) }
	}); }

	// TODO: Removing functions //
	remove( _table, _hash ){
		return new Promise( (res,rej)=>{ try{

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

		} catch(e) { rej(e) }
	}); }

	removeTable( _table ){
		return new Promise( (res,rej)=>{
			const _path = `${this.path}/${_table}`;
			fs.unlink( _path,( err,data )=>{
				if(err) rej( err );
				res({ table: _table });
			});
		})
	}

	shift( _table ){
		return new Promise( (res,rej)=>{ try{

			let { _i,_cfg,_itr,_res,_tmp,_path } = init( _table,null,this );
			const writable = fs.createWriteStream( _tmp );

			_itr.on( 'line',( line )=>{ if( _i != 0 ) writable.write( `${line}\n` ); _i++;});

			_itr.on( 'close',()=>{ writable.end(); });

			writable.on( 'finish',()=>{ fs.renameSync( _tmp, _path ); res({
				table: _table,
			}); });

		} catch(e) { rej(e) }
	}); }

}

//TODO: localDB Class ----------------------------------------------------------------------------//
module.exports = localDB;
