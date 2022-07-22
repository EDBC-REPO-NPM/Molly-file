const mongodb = require('mongodb').MongoClient;
const crypto = require('crypto-js');

//TODO: mongoDB Class ----------------------------------------------------------------------------//
class mongoDB{

	default = { offset: 0, length: 100, sort:{} }

	constructor( _name,_URL ){
		this.name = _name;
		this.path = _URL;
	}

	// TODO: Searching functions //
	list( _table, _config ){
		return new Promise( (res,rej)=>{
			mongodb.connect(this.path, (err, db)=>{ 

				if (err) rej( err );
				if( !_config ) _config = this.default;

				db.db(this.name).collection(_table)
				.find({})
				.sort(_config.sort)
				.skip( _config.offset )
             	.limit( _config.length )
				.toArray((err,data)=>{
					if (err) rej( err );
					db.close(); res({
						table: _table,
						data: data
					});
				});

			});
		});
	}

	match( _table, _target, _index, _config ){
		return new Promise( (res,rej)=>{
			mongodb.connect(this.path, (err, db)=>{ 

				if (err) rej( err );
				if( !_config ) _config = this.default;

				db.db(this.name).collection(_table)
				.find({ $text: { $search:_target } })
				.sort(_config.sort)
				.skip( _config.offset )
             	.limit( _config.length )
				.toArray((err,data)=>{
					if (err) rej( err );
					db.close(); res({
						table: _table,
						data: data
					});
				});

			});
		});
	}

	find( _table, _object, _config ){
		return new Promise( (res,rej)=>{
			mongodb.connect(this.path, (err, db)=>{ 

				if (err) rej( err );
				if( !_config ) _config = this.default;

				db.db(this.name).collection(_table)
				.find( _object )
				.sort(_config.sort)
				.skip( _config.offset )
             	.limit( _config.length )
				.toArray((err,data)=>{
					if (err) rej( err );
					db.close(); res({
						table: _table,
						data: data,
					});
				});

			});
		});
	}

	findByHash( _table, _hash, _config ){
		return new Promise( (res,rej)=>{
			mongodb.connect(this.path, (err, db)=>{ 

				if (err) rej( err );
				if( !_config ) _config = this.default;

				db.db(this.name).collection(_table)
				.createIndex( _index )
				.find( {hash:_hash} )
				.sort(_config.sort)
				.skip( _config.offset )
             	.limit( _config.length )
				.toArray((err,data)=>{
					if (err) rej( err );
					db.close(); res({
						table: _table,
						data: data,
					});
				});

			});
		});
	}

	createNewHash( _object ){
		try{
			return _object.map( (item)=>{
				item['_stamp'] = Date.now();
				const _base = JSON.stringify( item );
				if( !item.hash )
					item.hash = crypto.SHA256( _base ).toString();
				return item;
			});
		} catch(e) {
			_object['_stamp'] = Date.now();
			const _base = JSON.stringify( _object );
			if( !_object.hash )
				_object.hash = crypto.SHA256( _base ).toString();
			return _object;
		}
		
	}

	// TODO: Saving functions //

	push( _table, ..._object ){
		return new Promise( (res,rej)=>{
			mongodb.connect(this.path, (err, db)=>{ 

				if (err) rej( err );
				_object = this.createNewHash( _object.flat() );
				db.db(this.name).collection(_table)
				.insertMany( _object.flat(),(err,data)=>{
					if (err) rej( err );
					db.close(); res({
						table: _table,
						data: data,
					});
				});

			});
		});
	}

	update( _table, _hash, _object ){
		return new Promise( (res,rej)=>{
			mongodb.connect(this.path, (err, db)=>{ 

				if (err) rej( err );
				_object = this.createNewHash( _object );
				db.db(this.name).collection(_table)
				.updateOne({ hash:_hash },{$set:_object},(err,data)=>{
					if (err) rej( err );
					db.close(); res({
						table: _table,
						data: data,
					});
				});

			});
		});
	}

	// TODO: Removing functions //
	remove( _table, _hash ){
		return new Promise( (res,rej)=>{
			mongodb.connect(this.path, (err, db)=>{ 

				if (err) rej( err );
				db.db(this.name).collection(_table)
				.deleteOne({ hash:_hash },(err,data)=>{
					if (err) rej( err );
					db.close(); res({
						table: _table,
						data: data,
					});
				});

			});
		});
	}

	addTable( _table ){
		return new Promise( (res,rej)=>{
			mongodb.connect(this.path, (err, db)=>{ 
				if (err) rej( err );
				db.db(this.name).createCollection(_table);
				res({
					table: _table,
					data: data,
				});
			});
		});
	}

	removeTable( _table ){
		return new Promise( (res,rej)=>{
			mongodb.connect(this.path, (err, db)=>{ 

				if (err) rej( err );
				db.db(this.name).collection(_table)
				.drop((err, delOK)=>{
					if (err) rej( err );
					db.close(); res({
						table: _table,
						data: data,
					});
				});

			});
		});
	}

}

//TODO: localDB Class ----------------------------------------------------------------------------//
module.exports = mongoDB;
