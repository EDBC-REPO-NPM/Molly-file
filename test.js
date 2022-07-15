
const lwdb = require('./main');

let pass = 'mypass'
let ldb = new lwdb.createStreamDB( __dirname,pass );

/**/
ldb.list( 'http://localhost:3000/peliculas.json' )
.then( (info)=>{
	console.log( info );
});
/**/
