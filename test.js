const db = require('./main');

sdb = new db({
    path: `./dbTest`,
    pass: 'bbc9409c9e83a9fbcb507aac581b5c84343152da90eb94d11b8d90859886dcef'
}).then(()=>{
    console.log('done');
}).catch(e=>{
    console.log(e);
});