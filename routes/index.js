//Es la ruta necesaria para ejecutar el programa
//Exportamos los paquetes de la variable 'Router' del paquete de express.
const express = require('express');
const cors = require('cors')
const { Router } = express
const jwt = require('jsonwebtoken')
const { db } = require('../cnn')
//Con esto podemos acceder al uso de las variables de entorno en .env
require('dotenv').config()

const router = Router()
router.use(express.urlencoded({ extended: false }))
router.use(express.json())
router.use(cors())

//Creamos una variable para instanciar una variable para usar 
//el paquete exportado
const { getCategorias, getCategoriaById, getCategoriaByName, updateCategoria, deleteCategoria, postCreateCategoria } = require('../controllers/controlador-categoria')
const { getPrueba, updateProductoById, updateEstadoProductoById, getProductos, postCreateProducto, getProductosById, getProductosByName, deleteProducto, getAtributosProById, getProductosD, getProductosByIdD, getProductosByNameD, putUpdateProducto, deleteProductoB } = require('../controllers/controlador-producto')
const { getAjuste, getAjusteDetalles, updateAjuste, postCreateAjuste, updateAjusteDetalleById, postCreateDetalleAjuste, postCreateAjustecompleto, putUpdateAjuste, updateAjusteDetalle } = require('../controllers/controlador-ajuste')
const { postDatosSesion } = require('../controllers/controlador-sesion')
const { getClientes, getClienteByName, postCliente, getClienteById, putCliente, deleteCliente } = require('../controllers/controlador-cliente')
const { getVentas, postVenta, getVentaById, putVenta, deleteVenta } = require("../controllers/controlador-venta")
const { getTipoAjustes, getTipoAjusteById, getTipoAjusteByName, updateTipoAjuste } = require("../controllers/controlador-tipoAjuste")

//Rutas
router.get('/pruebaApi', getPrueba)

//SESION
router.post('/inicioSesion', validateAccesToken, postDatosSesion)

//CATEGORÍAS
router.get('/categorias', validateAccesToken, getCategorias)
router.get('/categorias/id/:cat_id', validateAccesToken, getCategoriaById)
router.get('/categorias/nombre/:cat_nombre', validateAccesToken, getCategoriaByName)
router.post('/categorias/nuevo', validateAccesToken, postCreateCategoria)
router.put('/updateCategoria/:cat_id', validateAccesToken, updateCategoria)
router.put('/categorias/delete', validateAccesToken, deleteCategoria)

//PRODUCTOS
router.get('/productos', validateAccesToken, getProductos)
router.get('/productos/id/:pro_id', validateAccesToken, getProductosById)
router.get('/productos/atributos/:pro_id', getAtributosProById)
router.get('/productos/nombre/:pro_nombre', getProductosByName)
router.post('/productos/nuevo', validateAccesToken, postCreateProducto)
router.put('/updateProducto', validateAccesToken, updateProductoById)
router.put('/producto/:pro_id', validateAccesToken, deleteProducto)
router.put('/updateEstadoProducto', validateAccesToken, updateEstadoProductoById)
router.put('/ActualizarProducto', validateAccesToken, putUpdateProducto)
router.put('/updateAjusteDetalle', validateAccesToken, updateAjusteDetalleById)
router.delete('/producto/:pro_id', validateAccesToken, deleteProductoB);


router.get('/productosD', validateAccesToken, getProductosD)
router.get('/productosD/id/:pro_id', validateAccesToken, getProductosByIdD)
router.get('/productosD/nombre/:pro_nombre', validateAccesToken, getProductosByNameD)

//AJUSTE
router.get('/ajustes', validateAccesToken, getAjuste)
router.get('/ajustesDetalles', validateAccesToken, getAjusteDetalles)
router.post('/ajustes/nuevo', validateAccesToken, postCreateAjuste)
router.post('/detalles/nuevo', validateAccesToken, postCreateDetalleAjuste)
router.post('/ajustes/nuevoC', validateAccesToken, postCreateAjustecompleto)
router.put('/updateAjusteCompleto/:aju_det_id', validateAccesToken, putUpdateAjuste)
router.put('/updateAjuste', updateAjuste)
router.put('/updateAjusteDetalles/:aju_numero', updateAjusteDetalle)

//CLIENTE
router.get('/clientes',validateAccesToken, getClientes);
router.get('/clientes/:cli_id',validateAccesToken,getClienteById)
router.get('/clientes/nombre/:cli_nombre',validateAccesToken, getClienteByName);

router.post('/clientes/nuevo',validateAccesToken, postCliente)
router.put('/clientes/actualizar', validateAccesToken, putCliente)
router.delete('/clientes/eliminar/:cli_id', validateAccesToken, deleteCliente)

//VENTA
router.get('/ventas', validateAccesToken, getVentas);
router.get('/ventas/:ven_id',validateAccesToken,getVentaById)
router.post('/ventas/nuevo',validateAccesToken, postVenta)
router.put('/ventas/actualizar', validateAccesToken, putVenta)
router.delete('/ventas/eliminar/:ven_id', validateAccesToken, deleteVenta)

//TIPO AJUSTE
router.get('/tipoajuste/nombre/:tipo_nombre',validateAccesToken, getTipoAjusteByName);
router.get('/tipoAjustes',validateAccesToken, getTipoAjustes);
router.get('/tipoajuste/:tipo_id',validateAccesToken, getTipoAjusteById);
router.put('/tipoAjuste', validateAccesToken, updateTipoAjuste);


//Autenticacion y generacion de token
router.get('/auth', async (req, res) => {
    const { username, password } = req.body
    const aut = await db.any('SELECT * FROM usuarios WHERE usu_nombre = \'' + username + '\' AND usu_password = \'' + password + '\'')
    if (!aut[0]) return res.json({
        message: 'Usuario o contraseña incorrectas'
    })
    const user = {
        username: username
    }
    const accesToken = generateAccesToken(user)
    res.header('authorization', accesToken).json({
        message: 'Usuario autenticado',
        token: accesToken
    })
})

function validateAccesToken(req, res, next) {
    const accesToken = req.headers['authorization']
    if (!accesToken) res.json({
        message: 'Acceso denegado falta de token'
    })
    jwt.verify(accesToken, process.env.clave, (err, user) => {
        if (err) {
            res.json({
                message: 'Acceso denegado, token invalido o incorrecto'
            })
        } else {
            req.user = user
            next()
        }
    })
}

function generateAccesToken(user) {
    return jwt.sign(user, process.env.clave, { expiresIn: '72h' });
}

module.exports = router

