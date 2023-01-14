const db = require('./main.js'); 
const path = require('path');
const mdb = new db({
    path: path.join(__dirname,'db'), pass:"1234", thread: 2,
    import: './db/table', protocol: 'WebSocket'
});