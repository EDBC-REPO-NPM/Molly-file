const readline = require('./readline');
const fetch = require('axios');
const fs = require('fs');

//TODO: Optimization FUnctions -------------------------------------------------------------------//

const _default = { offset: 0, length: 100 };

const init = function( _table,_config,_self ){
	return new Promise( (response,reject)=>{
		const path = `${_self.path}/${_table}.json`;
		fetch.get(path,{responseType:'stream'}).then(({data})=>{
			response({
				_cfg: config(_config),
				_path: null,
				_tmp: null,
				_tbl: data,
			});
		});
	});
};

function config(_config){
	if( !_config ) return _default;
    Object.keys(_config).map((x)=>{
        _default[x] = _config[x];
    }); return _default;
}

//TODO: localDB Class ----------------------------------------------------------------------------//

class streamDB{

	constructor( _object ){
		if( _object.pass ){
			this.password = _object.pass;
		} 	this.path = _object.path;
	}
	
	// TODO: Searching functions --------------------------------------------------- //
	list( _table, _config ){
		return new Promise( async(response,reject)=>{ try{
			const { _cfg,_tbl,_tmp,_path } = await init( _table,_config,this );
			let data = await readline.list( this,_tbl,_cfg );
				data = data.map(x=>{ return JSON.parse(x) });
			response({ data:data, table:_table });
		} catch(e) { reject(e); }}); 
	}

	find( _table, _target, _config ){
		return new Promise( async(response,reject)=>{ try{
			const { _cfg,_tbl,_tmp,_path } = await init( _table,_config,this );
			let data = await readline.find( this,_tbl,_target,_cfg );
				data = data.map(x=>{ return JSON.parse(x) });
			response({ data:data, table:_table });
		} catch(e) { reject(e); }}); 
	}

	match( _table,_match,_config ){
		return new Promise( async(response,reject)=>{ try{
			const { _cfg,_tbl,_tmp,_path } = await init( _table,_config,this );
			let data = await readline.match( this,_tbl,_match,_cfg );
				data = data.map(x=>{ return JSON.parse(x) });
			response({ data:data, table:_table });
		} catch(e) { reject(e); }}); 
	}

	hash( _table, _hash ){
		return new Promise( async(response,reject)=>{ try{
			const { _cfg,_tbl,_tmp,_path } = await init( _table,null,this );
			let data = await readline.hash( this,_tbl,_hash );
				data = data.map(x=>{ return JSON.parse(x) });
			response({ data:data, table:_table });
		} catch(e) { reject(e); }}); 
	}

}

//TODO: localDB Class ----------------------------------------------------------------------------//
module.exports = streamDB;