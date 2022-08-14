const crypto = require('crypto-js');
const {Buffer} = require('buffer'); 
const output = new Object();

/* -------------------------------------------------------------------------------------------------------- */

const JsonFormatter = {

	'stringify': function(cipherParams) {
    	var jsonObj = { ct: cipherParams.ciphertext.toString(crypto.enc.Base64) };
    	if (cipherParams.salt) jsonObj.s = cipherParams.salt.toString();
	    if (cipherParams.iv) jsonObj.iv = cipherParams.iv.toString(); 
	    return new Buffer.from(JSON.stringify(jsonObj)).toString('base64');
  	},

  	'parse': function(jsonStr) {
    	var jsonObj = JSON.parse( new Buffer.from(jsonStr,'base64').toString());
    	var cipherParams = crypto.lib.CipherParams.create({
     	 	ciphertext: crypto.enc.Base64.parse(jsonObj.ct)
    	});
    	if (jsonObj.iv) cipherParams.iv = crypto.enc.Hex.parse(jsonObj.iv);
    	if (jsonObj.s) cipherParams.salt = crypto.enc.Hex.parse(jsonObj.s);
    	return cipherParams;
 	}

};

/* -------------------------------------------------------------------------------------------------------- */

function slugify(str){ 
	const map = {
		'c' : 'ç',
		'n' : 'ñ',
		'e' : 'é|è|ê|ë',
		'i' : 'í|ì|î|ï',
		'u' : 'ú|ù|û|ü',
		'o' : 'ó|ò|ô|õ|ö',
		'a' : 'á|à|ã|â|ä',
		''  : /\s+|\W+/,
	};	
	for (var pattern in map) { 
		str=str.replace( new RegExp(map[pattern],'gi' ), pattern); 
	}	return str.toLowerCase();
}

function encrypt( _message,_password ){ 
    try{if( _password )
        return crypto.AES.encrypt( _message,_password,{
            format: JsonFormatter
        }).toString(); return _message;
    } catch(e) { return _message; }
}

function decrypt( _message,_password ){ 
    try{if( _password )
        return crypto.AES.decrypt( _message,_password,{
                format: JsonFormatter
            }).toString( crypto.enc.Utf8 );
        return _message;
    } catch(e) { return _message; }
}

function processData( _chunk ){
    for( var i=_chunk.length; i--; ){
        if( _chunk[i]==10 || _chunk[i]==13 )
            return [
                _chunk.slice(0,i),
                _chunk.slice(i),
            ];
    } return [ null, _chunk ];
}

/* -------------------------------------------------------------------------------------------------------- */

function dbDecrypt( _list,_self ){ return _list.map((x)=>{ return decrypt(x,_self?.password) }); }

function dbEncrypt( _list,_self ){ return _list.map((x)=>{ return encrypt(x,_self?.password) }); }

/* -------------------------------------------------------------------------------------------------------- */

output.readLine = ( _self,_stream,_config,_data )=>{
    return new Promise((response,reject)=>{
        
        let offset = 0;
        const db = new Array();
        let prcd = new Array();
        let data = new Buffer(0);
    
        _stream.on('data',async(chunk)=>{
            
            data = Buffer.concat([ data,chunk ]);
            prcd = processData( data );
            data = prcd[1];
    
            if( prcd[0] ){

                const encrypted = prcd[0].toString().split('\n');
                const decrypted = dbDecrypt(encrypted,_self);

                const done = await _data( db,decrypted,_config );
                offset += done.length; 
        
                if( db.length >= _config.length ) 
                    _stream.destroy(); 
                else if ( offset > _config.offset && db.length != 0 )
                    db.push( ...done );
                else if ( offset > _config.offset && db.length == 0 )
                    db.push( ...done.slice( offset - done.length - _config.offset - 1 ) );
                
            }
    
        });
    
        _stream.on('close',async()=>{ response( db.slice( 0,_config.length ) ); });

    });
}

output.list = ( _self,_stream,_config )=>{
   
    const onData = ( db,data,_config )=>{ 
        return new Promise((response,reject)=>{
            try{ 
                const index = data.findIndex((x)=>x=='');
                data.splice( index,1 );
            } catch(e) {} response(data);
        });
    }

    return new Promise((response,reject)=>{
        response( output.readLine( _self,_stream,_config,onData ));
    });

}

output.match = ( _self,_stream,_target,_config )=>{

    const onData = ( db,data,_config )=>{
        return new Promise((response,reject)=>{
            const done = new Array();
            data.map(x=>{ 
                try{
                    if( (new RegExp(slugify(_target),'gi')).test(slugify(x)) )
                    done.push(x);
                } catch(e) {} }); 
            response(done);
        });
    }

    return new Promise((response,reject)=>{
        response(output.readLine( _self,_stream,_config,onData ));
    });
    
}

output.find = ( _self,_stream,_target,_config )=>{

    const onData = ( db,data,_config )=>{
        return new Promise((response,reject)=>{
            const done = new Array();
            data.map(x=>{ 
                try{
                    const data = JSON.parse(x);
                    const cond = Object.keys(_target)
                    .every(y=>{
                        return (_target[y]).test(data[y]); 
                    }); if( cond ) done.push(x);
                } catch(e) {}
            }); response(done);
        });
    }

    return new Promise((response,reject)=>{
        response(output.readLine( _self,_stream,_config,onData ));
    });
    
}

output.hash = ( _self,_stream,_target )=>{

    const onData = ( db,data,_config )=>{
        return new Promise((response,reject)=>{
            data.some((x)=>{ 
                try{
                    const y = JSON.parse(x);
                    if( y.hash == _target )
                        response([x]);
                } catch(e) {} 
            });
        });
    }

    const _config = { offset:0, length:1 };
    return new Promise((response,reject)=>{
        response(output.readLine( _self,_stream,_config,onData ));
    });
    
}

output.stream = ( _self,_stream,_config,_onData )=>{
    return new Promise((response,reject)=>{
        response(output.readLine( _self,_stream,_config,_onData ));
    });
}

/* -------------------------------------------------------------------------------------------------------- */

module.exports = output;
