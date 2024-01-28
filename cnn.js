//Importa el paquete
const pgPromise = require('pg-promise')
const config = {
    host: 'dpg-cmr6c5g21fec739pvs10-a.ohio-postgres.render.com',
    port: '5432',
    database: 'mokadb_qjuw',
    user: 'richleid',
    password: 'nMJEVYcBaWgGsZojzCiRS9MoX7XWchla',
    ssl: {
        rejectUnauthorized: false
    }
}
//Instancia como objeto
const pgp = pgPromise({})
const db = pgp(config)

// console.log('Conexion ok')
// db.any('Select * from categoria')
//     .then(res => { console.table(res) })

//Permite exportar la variable a otros archivos
exports.db = db