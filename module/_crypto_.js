
const crypto = require('crypto-js');
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

/* --------------------------------------------------------------------------------------- */

output.slugify = (str)=>{ 
	[
		['c','ç'],
		['n','ñ'],
		['e','é|è|ê|ë'],
		['i','í|ì|î|ï'],
		['u','ú|ù|û|ü'],
		['o','ó|ò|ô|õ|ö'],
		['a','á|à|ã|â|ä'],
		['' ,/\s+|\W+/,]
	].map(x=>{
		const regex = new RegExp(x[1],'gi');
		str = str.replace( regex,x[0] );
	});	return str.toLowerCase();
}

output.hash = (data,nonce)=>{
	return crypto.SHA256(Math.random+data+nonce).toString();
}

output.encrypt = ( _message,_password )=>{ 
    try{if( _password )
        return crypto.AES.encrypt( _message,_password,{
            format: JsonFormatter
        }).toString(); return _message;
    } catch(e) { return _message; }
}

output.decrypt = ( _message,_password )=>{ 
    try{if( _password )
        return crypto.AES.decrypt( _message,_password,{
                format: JsonFormatter
            }).toString( crypto.enc.Utf8 );
        return _message;
    } catch(e) { return _message; }
}

/* -------------------------------------------------------------------------------------------------------- */

module.exports = output;