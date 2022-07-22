const modules = new Object();

try{ modules.createStreamDB = require('./module/streamDB'); } catch(e) { /*console.log(e)*/ }
try{ modules.createMongoDB = require('./module/mongoDB'); } catch(e) { /*console.log(e)*/ }
try{ modules.createLocalDB = require('./module/localDB'); } catch(e) { /*console.log(e)*/ }
try{ modules.createWebDB = require('./module/webDB'); } catch(e) { /*console.log(e)*/ }

module.exports = modules;