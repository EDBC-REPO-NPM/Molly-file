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
		['' ,/\s+|\W+| /,]
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

class State {

    state = new Object(); 
    events = new Array();
    update = new Array();
    active = true;

    constructor( state ){
        for( var i in state ){
            this.state[i] = state[i];
        }
    }

    set( state ){ let newState;
        
        const oldState = new Object();
        const keys = Object.keys(this.state);
        keys.map(x=>{ oldState[x]=this.state[x] });

        if( typeof state == 'function' ){
            newState = state( this.state ); const validator = [
                [!newState,'state is empty, please set a return state'],
                [typeof newState != 'object','state is not an object, please return a valid Object'],
            ];  if( validator.some(x=>{ if(x[0]) console.log(x[1]); return x[0] }) ) return 0;
        } else if( !state || typeof state != 'object' ) { 
            return console.log('state is not an object, please return a valid Object') 
        } else { newState = state; } 

        this.active = this.shouldUpdate(null,[this.state,newState]); 
        for( var i in newState ){ this.state[i] = newState[i];
            this.callback( i, oldState[i], newState[i] );
        }

    }

    get( item ){ return this.state[item] }

    shouldUpdate( callback,attr ){
        if( callback && typeof callback == 'function' )
            return this.update.push(callback);
        else if( callback && callback != 'function' )
            return console.log('callback should be a function');
        if( this.update.length == 0 ) return true;
        return this.update.some( x=>x(...attr) );
    }

    forceUpdate( item ){
        for( var i in this.events ){
            const field = this.events[i][0]
            this.events[i][1](
                this.state[field],
                this.state[field]
            );
        }
    }

    callback( item, prev, act ){
        if( !this.active ) return 0; 
        for( var i in this.events ){
            if( this.events[i][0] == item )
                this.events[i][1]( prev,act );
        }
    }

    observeField( field,callback ){
        const id = this.eventID();
        const event = [field,callback,id];
        this.events.push(event); return id;
    }

    unObserveField( eventID ){
        for( var i in this.events ){
            if( this.events[i][2] == eventID ){
                this.events.splice(i,1);
                return true;
            }
        }   return false;
    }

    eventID(){
        return crypto.SHA256(`
			${Math.random()}
			${Date.now()}
		`).toString();
    }

};	output.state = State;

/* -------------------------------------------------------------------------------------------------------- */

module.exports = output;