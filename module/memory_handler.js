/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

const utils = require('./utils.js');
const output = new Object();

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = function( data,db ){ 
    return new Promise((response,reject)=>{
        utils.validator( db,data ).then(()=>{
            try { response(Array.isArray(data) ? data.map(x=>utils[x.type](x,db)) : 
                                                 utils[data.type](data,db))
            } catch(e) { response(JSON.stringify({ status:404, message:`error: ${e.message}` })) }
        }).catch(e=>{ reject(JSON.stringify(e)) });
    })
};

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/