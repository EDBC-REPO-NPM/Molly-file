const db = require('./main.js'); 
const path = require('path');
const mdb = new db({
    import: 'https://raw.githubusercontent.com/EDBC-REPO-DB/AREPATV-DB/main', 
    path: path.join(__dirname,'db'), pass:"1234", thread: 2,
    protocol: 'WebSocket'
});