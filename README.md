# LWDB : lightweight Database

lw-db is a free and open source library for nodejs that allow you create a lightweight encrypted database using Json files

# Usage

### init lwdb on nodeJS
```

const lwdb = require('lwdb');

ldb = new lwdb.createLocalDB( '/PATH/TO/DATA/BASE' ); // for non encrypted data

// or

ldb = new lwdb.createLocalDB( '/PATH/TO/DATA/BASE', 'PASSWORD' ); // for encrypted data
	
```

### init lwdb on Browser
```

<script type="text/javascript" src="https://molly-js.github.io/MollyJS-Libs/molly.js" ></script>

<script type="text/javascript">
	require( libs.crypto, libs.lwdb )
	.then( ()=>{
		ldb = new lwdb.createWebDB( 'PASSWORD' );
	} )
</script>
	
```

### get an item list from a table
```
let table = 'tableName' //NOTE: if table doesn't exist lwdb generates a new one

let config = { offset:0, length:10 }

ldb.list( table,config )
.then( (response)=>{
	console.log( response );
})
```

### fing from a target object
```
let table = 'test';

let target = {
	name:'Peter'
}

let logic = 'AND' or 'OR'

let config = { // optional
	offset:0, length:10
}

ldb.find( table,target,logic,config )
.then( (response)=>{
	console.log( response );
});

```

### find by matching
```
let table = 'test';

let match = 'peter'

let config = { // optional
	offset:0, length:10
}

ldb.match( table,match,config )
.then( (response)=>{
	console.log( response );
});

```

### find by hash
```
let table = 'test';

let hash = 'SHA256_TEST'

let config = { // optional
	offset:0, length:10
}

ldb.findByHash( table,hash,config )
.then( (response)=>{
	console.log( response );
});

```

### push a new item at the end
```
let table = 'test';

let object = {
	name:'Peter',
	S: 'Male',
	age: 23,
}

ldb.push(table,object)
.then( ()=>{ /* once finish */ });

```

### push a new item at the beginning
```
let table = 'test';

let object = {
	name:'Peter',
	S: 'Male',
	age: 23,
}

ldb.unshift(table,object)
.then( ()=>{ /* once finish */ });

```

### place a new item in the middle
```
let table = 'test';

let line = 5; //if exist

let object = {
	name:'Peter',
	S: 'Male',
	age: 23,
}

ldb.place(table,line,object)
.then( ()=>{ /* once finish */ });

```

### replace an item
```
let table = 'test';

let hash = 'SHA256_TEST'

let object = {
	name:'Peter',
	S: 'Male',
	age: 23,
}

ldb.replace(table,hash,object)
.then( ()=>{ /* once finish */ });

```

### remove an item
```
let table = 'test';

let hash = 'SHA256_TEST'

ldb.remove(table,hash)
.then( ()=>{ /* once finish */ });

```

### remove the last item
```
let table = 'test';

ldb.pop(table)
.then( ()=>{ /* once finish */ });
```

### remove the first item
```
let table = 'test';

ldb.shift(table)
.then( ()=>{ /* once finish */ });
```

### remove a table
```
let table = 'test';

ldb.removeTable(table)
.then( ()=>{ /* once finish */ });

```
