/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

const utils = require('./utils.js');
const output = new Object();

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

function copy( A,B ){
    const result = new Object();
    Object.keys(A).map(x=>result[x] = A[x]);
    Object.keys(B).map(x=>result[x] = B[x]);
    return result;
}

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/

module.exports = function( data,inst,db ){ 
    return new Promise(async(response,reject)=>{
        const input = Array.isArray(inst) ? inst : [inst];
        const result = new Array();

        for( var i in input ){ 
            const cfg = copy(data,input[i]); try {
                const bool = await utils.validator(db,cfg);
                if( !bool[0] ) return reject(bool[1]);
                else result.push(await utils[cfg.type](cfg,db));
            } catch(e) {
                return reject({ status:404, message:`error: ${e.message}` })
            }
        }   return response( result );
    })
};

/*--────────────────────────────────────────────────────────────────────────────────────────────--*/