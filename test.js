const db = require('./main.js'); 
const path = require('path');
const mdb = new db({
    /* import: './db/table', protocol: 'WebSocket', */
    path: path.join(__dirname,'db'),  thread: 1,
});