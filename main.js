const output = new Object();

try{ output.streamDB = require('./module/streamDB'); } catch(e) { /*console.log(e)*/ }
try{ output.localDB = require('./module/localDB'); } catch(e) { /*console.log(e)*/ }

module.exports = output;