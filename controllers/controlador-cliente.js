const { db } = require("../cnn");

const getClientes = async (req, res) => {
    try {
        const response = await db.any('SELECT * FROM cliente;');
        res.json(response); // Envía directamente la respuesta sin envolverla en un objeto con 'clientes' como clave.
    } catch (error) {
        console.log(error.message); // Imprimir el mensaje de error
        res.status(500).json({ message: error.message }); // Responder con el mensaje de error
    }
}

const getClienteById = async (req, res) => {
    try {
        const { cli_id } = req.params
        const response = await db.one("SELECT * FROM cliente WHERE cli_id=$1;", [cli_id])
        return res.json({
            message: 'Ok',
            response: { response }
        })
    } catch (error) {
        console.log(error)
        return res.json({
            message: { error }
        })
    }
}

const getClienteByName = async (req, res) => {
    try {
        const cli_nombre = req.params.cli_nombre;
        const response = await db.any(`SELECT cli_id, cli_nombre FROM cliente WHERE cli_nombre = $1 
            AND cli_estado=true;`, [cli_nombre]);
        res.json(response);
    } catch (error) {
        console.log(error.message);
        res.json({ message: error.message });
    }
}
const postCliente = async (req, res) => {
    try {
        const {
            cli_nombre,
            cli_apellido,
            cli_email,
            cli_telefono,
            cli_estado
        } = req.body

        const response = await db.one("INSERT INTO cliente(cli_nombre, cli_apellido, cli_email, cli_telefono, cli_estado) VALUES($1, $2, $3, $4, $5) RETURNING cli_id", [cli_nombre, cli_apellido, cli_email, cli_telefono, cli_estado])
        return res.json({
            message: "Ok",
            response: response
        })
    } catch (error) {
        console.log(error);
        return res.json({ message: "Error" })
    }
}

const putCliente = async (req, res) => {
    try {
        const { 
            cli_id,
            cli_nombre,
            cli_apellido,
            cli_email,
            cli_telefono,
            cli_estado } = req.body

        let query = "UPDATE cliente SET "
        cli_nombre && `${query+="cli_nombre="+`'`+cli_nombre+`'`+","}`
        cli_apellido && `${query+="cli_apellido="+`'`+cli_apellido+`'`+","}`
        cli_email && `${query+="cli_email="+`'`+cli_email+`'`+","}`
        cli_telefono && `${query+="cli_telefono="+`'`+cli_telefono+`'`+","}`
        cli_estado && `${query+="cli_estado="+cli_estado+","}`

        query[query.length-1]=="," && `${query = query.slice(0,query.length-1)}`
        const response = db.none(query+" WHERE cli_id=$1",[cli_id]);
        return res.json({
            message: "Ok!! el cliente fue actualizado correctamente."
        })
    } catch (error) {
        console.log(error)
        return res.json({
            message: error
        })
    }
}

const deleteCliente = async (req, res) =>{
    try {
        const { cli_id } = req.params
        const response = db.none("DELETE FROM cliente WHERE cli_id=$1",[cli_id])

        return res.json({
            message:`Ok!! Cliente con id ${cli_id} eliminado con exito`,
        })
    } catch (error) {
        console.log(error)
        return res.json({
            message:error
        })
    }
}

module.exports = {
    getClientes,
    getClienteByName,
    getClienteById,
    postCliente,
    putCliente,
    deleteCliente
}