const modules = new Object();

try{ modules.createStreamDB = require('./streamDB'); } catch(e) { /*console.log(e)*/ }
try{ modules.createMongoDB = require('./mongoDB'); } catch(e) { /*console.log(e)*/ }
try{ modules.createLocalDB = require('./localDB'); } catch(e) { /*console.log(e)*/ }
try{ modules.createWebDB = require('./webDB'); } catch(e) { /*console.log(e)*/ }

module.exports = modules;