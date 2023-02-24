const crypto = require('crypto-js');
const {Buffer} = require('buffer');
const output = new Object();

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

const mime = {
	
	"txt" : "text/plain",
	"text": "text/plain",
	
	"otf" : "font/otf",
	"ttf" : "font/ttf",
	"woff": "font/woff",
	"woff2":"font/woff2",
	
	"oga" : "audio/ogg",
	"aac" : "audio/aac",
	"wav" : "audio/wav",
	"mp3" : "audio/mpeg",
	"opus": "audio/opus",
	"weba": "audio/webm",
	
	"ogv" : "video/ogg",
	"mp4" : "video/mp4",
	"ts"  : "video/mp2t",
	"webm": "video/webm",
	"mpeg": "video/mpeg",
	"avi" : "video/x-msvideo",
	
	"css" : "text/css",
	"csv" : "text/csv",
	"html": "text/html",
	"scss": "text/scss",
	"ics" : "text/calendar",
	"js"  : "text/javascript",
	"xml" : "application/xhtml+xml",

	"bmp" : "image/bmp",
	"gif" : "image/gif",
	"png" : "image/png",
	"jpg" : "image/jpeg",
	"jpeg": "image/jpeg",
	"webp": "image/webp",
	"svg" : "image/svg+xml",
	"ico" : "image/vnd.microsoft.icon",
	
	"zip" : "application/zip",
	"gz"  : "application/gzip",
	"sh"  : "application/x-sh",
	"json": "application/json",
	"tar" : "application/x-tar",
	"rar" : "application/vnd.rar",
	"7z"  : "application/x-7z-compressed",
	"m3u8": "application/vnd.apple.mpegurl",
	
	"pdf" : "application/pdf",
	"doc" : "application/msword",
	"vsd" : "application/vnd.visio",
	"xls" : "application/vnd.ms-excel",
	"ppt" : "application/vnd.ms-powerpoint",
	"swf" : "application/x-shockwave-flash",
	"ods" : "application/vnd.oasis.opendocument.spreadsheet",
	"odp" : "application/vnd.oasis.opendocument.presentation",
	"odt" : "application/vnd.oasis.opendocument.presentation",
	"xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    
};

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

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

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

output.slugify = (str)=>{ 
	[
		['e','é|è|ê|ë'],
		['i','í|ì|î|ï'],
		['u','ú|ù|û|ü'],
		['o','ó|ò|ô|õ|ö'],
		['a','á|à|ã|â|ä'],
		['c','ç'],['n','ñ'],
		['' ,/\s+|\W+|\n| /],
	].map(x=>{
		const regex = new RegExp(x[1],'gi');
		str = str.replace( regex,x[0] );
	});	return str.toLowerCase();
}

output.hash = (data,nonce)=>{ return crypto.SHA256(Math.random+data+nonce).toString(); }

output.encrypt = ( _message,_password )=>{ 
    try{ if( _password )
        return crypto.AES.encrypt( _message,_password,{ format: JsonFormatter })
						 .toString(); return _message;
    } catch(e) { return _message; }
}

output.decrypt = ( _message,_password )=>{ 
    try{ if( _password )
        return crypto.AES.decrypt( _message,_password,{ format: JsonFormatter })
						 .toString( crypto.enc.Utf8 ); return _message;
    } catch(e) { return _message; }
}

output.mimeType = function( _path ){
	if( !(/\.\w+$/).test(_path) ) return 'text/html';
	for(var key of Object.keys(mime)){ 
		if( _path.endsWith(key) ) return mime[key];
	}	return 'text/plain';
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = output;