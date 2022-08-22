const db = require('./main.js');
const sdb = new db({
    path: './db',
    pass: '1234', 
}).then(()=>{

}).catch((e)=>{
    console.log(e);
});