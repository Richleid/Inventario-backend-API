const express = require("express");
const { db } = require("../cnn");

const getPrueba = (req, res) => {
  console.log("Funciona");
  res.send("Funciona el metodo de prueba original");
};

/**
 * Calcula el stock de los ajustes realizados a un producto mediante su id
 * @param {number} pro_id Identificador del producto
 * @returns Json con calculo del stock
 */
function ajustesStock(pro_id) {
  try {
    return new Promise((resolve) => {
      let query = 'select ad.aju_det_cantidad, ad.aju_det_estado from producto pro, ajuste_detalle ad where pro.pro_id=ad.pro_id and pro.pro_id=$1';
      db.any(query, [pro_id])
        .then((data) => {
          let suma = 0;
          for(let i = 0; i < data.length; i++){
            if(data[i].aju_det_estado == true || data[i].aju_det_estado == false){ // verifica el estado antes de sumar
              suma += Number(data[i].aju_det_cantidad); // convierte a número antes de sumar
            }
          }
          resolve(suma);
        })
        .catch((error) => {
          console.log('Error en la consulta: ', error);
        });
    });
  } catch (error) {
    console.log('Error en la función: ', error);
  }
}

const getProductos = async (req, res) => {
  try {
    const productos = await db.any(`
      SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, pro.pro_stock, cat.cat_id, cat.cat_nombre
      FROM producto pro
      LEFT JOIN categoria cat ON pro.cat_id = cat.cat_id
      WHERE pro.pro_estado = true
      ORDER BY pro.pro_id;
    `);
    res.json(productos);
  } catch (error) {
    console.log(error);
    res.status(500).json({ Mensaje: "Error al obtener los productos" });
  }
};

const getProductosById = async (req, res) => {
  try {
    const pro_id = req.params.pro_id;
    const response = await db.one(
      `SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, pro.pro_stock, cat.cat_id, cat.cat_nombre
        FROM producto pro
        INNER JOIN categoria cat ON pro.cat_id = cat.cat_id
        WHERE pro.pro_id = $1 AND pro.pro_estado = true;`,
      [pro_id]
    );
    res.json(response);
  } catch (error) {
    console.log(error.Mensaje);
    res.json({ Mensaje: error.Mensaje });
  }
};

const getProductosByName = async (req, res) => {
  try {
    const pro_nombre = req.params.pro_nombre;
    const response = await db.any(
      `SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, cat.cat_id, cat.cat_nombre
       FROM producto pro
       INNER JOIN categoria cat ON pro.cat_id = cat.cat_id
       WHERE pro.pro_nombre = $1 AND pro.pro_estado = true;`,
      [pro_nombre]
    );
    res.json(response);
  } catch (error) {
    console.log(error.message);
    res.json({ message: error.message });
  }
};

const getProductosD = async (req, res) => {
  try {
    let response = [];
    const productos = await db.any(`
        SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen,
        cat.cat_id, cat.cat_nombre 
        FROM producto pro 
        LEFT JOIN categoria cat ON pro.cat_id = cat.cat_id 
        WHERE pro.pro_estado = false ORDER BY pro.pro_id;`);
    res.json(productos);
  } catch (error) {
    console.log(error.Mensaje);
    res.json({ Mensaje: error.Mensaje });
  }
};

const getProductosByIdD = async (req, res) => {
  try {
    const pro_id = req.params.pro_id;
    const response = await db.one(
      `SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, cat.cat_id, cat.cat_nombre
        FROM producto pro
        INNER JOIN categoria cat ON pro.cat_id = cat.cat_id
        WHERE pro.pro_id = $1 AND pro.pro_estado = false;`,
      [pro_id]
    );
    res.json(response);
  } catch (error) {
    console.log(error.Mensaje);
    res.json({ Mensaje: error.Mensaje });
  }
};

const getProductosByNameD = async (req, res) => {
  try {
    const pro_nombre = req.params.pro_nombre;
    const response = await db.one(
      `SELECT pro.pro_id, pro.pro_nombre, pro.pro_descripcion, pro.pro_valor_iva, pro.pro_costo, pro.pro_pvp, pro.pro_imagen, cat.cat_id, cat.cat_nombre
        FROM producto pro
        INNER JOIN categoria cat ON pro.cat_id = cat.cat_id
        WHERE pro.pro_nombre = $1 AND pro.pro_estado = false;`,
      [pro_nombre]
    );
    res.json(response);
  } catch (error) {
    console.log(error.message);
    res.json({ message: error.message });
  }
};

const postCreateProducto = async (req, res) => {
  try {
    let {
      pro_nombre,
      pro_descripcion,
      cat_id,
      pro_valor_iva,
      pro_costo,
      pro_pvp,
      pro_imagen,
      pro_stock // Incluir stock en los parámetros
    } = req.body;

    // Verificar si existe un producto con el mismo nombre (ignorando mayúsculas y minúsculas)
    const existingProduct = await db.oneOrNone('SELECT pro_id FROM producto WHERE LOWER(pro_nombre) = LOWER($1);', [pro_nombre]);

    if (existingProduct) {
      return res.status(400).json({ Mensaje: 'Ya existe un producto con el mismo nombre en la base de datos.' });
    }

    // Si el producto no existe, lo insertamos en la base de datos como se hacía anteriormente
    const response = await db.one(
      `INSERT INTO producto(pro_nombre, pro_descripcion, cat_id, pro_valor_iva, pro_costo, pro_pvp, 
        pro_imagen, pro_estado, pro_stock) VALUES($1, $2, $3, $4, $5, $6, $7, true, $8) RETURNING *;`,
      [
        pro_nombre,
        pro_descripcion,
        cat_id,
        pro_valor_iva,
        pro_costo,
        pro_pvp,
        pro_imagen,
        pro_stock // Pasar stock a la consulta
      ]
    );

    res.json({
      Mensaje: "Producto creado con éxito",
      response: response,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ Mensaje: error.message });
  }
};


const updateEstadoProductoById = async (req, res) => {
  const { pro_id, pro_estado } = req.body;
  if (pro_id.length == 0) {
    return res.json({
      mensaje: "Error",
      response: "Revise el parametro pro_id.",
    });
  }
  if (pro_estado.length == 0) {
    return res.json({
      mensaje: "Error",
      response: "Revise el parametro pro_estado.",
    });
  }
  try {
    const response = await db.none(
      "UPDATE PRODUCTO SET pro_estado = $2 WHERE pro_id = $1",
      [pro_id, pro_estado]
    );
    return res.json({
      mensaje: "Correcto",
      response:
        "Estado de producto actualizado a " + pro_estado + " exitosamente.",
    });
  } catch (error) {
    return res.json({
      mensaje: "Error",
      response: "Error con la sentencia SQL " + error.Mensaje + ".",
    });
  }
};

const updateProductoById = async (req, res) => {
  const { pro_id, pro_campo } = req.body;
  let respuesta = "";
  if (pro_id.length == 0) {
    return res.json({
      mensaje: "Error",
      response: "Revise el parametro pro_id.",
    });
  }
  if (pro_campo.length == 0) {
    return res.json({
      mensaje: "Error",
      response: "Revise el parametro pro_campo.",
    });
  }
  try {
    const sentencia = pro_campo.forEach(async (valores) => {
      if (
        (valores["campo"] === "pro_valor_iva" ||
          valores["campo"] === "pro_costo" ||
          valores["campo"] === "pro_pvp") &&
        valores["valor"] < 0
      ) {
        return res.json({
          mensaje: "Error",
          response: "El valor asigando no puede ser menor que 0",
        });
      }
      const response = await db.none(
        "UPDATE PRODUCTO SET " + valores["campo"] + " = $2 WHERE pro_id = $1",
        [pro_id, valores["valor"]]
      );
    });
    return res.json({
      mensaje: "Correcto",
      response: "Campos actualizados del producto con id " + pro_id,
    });
  } catch (error) {
    return res.json({
      mensaje: "Error",
      response: "Error con la sentencia SQL " + error.Mensaje + ".",
    });
  }
};

const deleteProducto = async (req, res) => {
  try {
    const pro_id = req.params.pro_id; // Obtén la ID del producto desde la ruta
    const response = await db.one(
      "UPDATE producto SET pro_estado=false WHERE pro_id=$1 RETURNING *;",
      [pro_id]
    );
    res.json({
      message: "Producto desactivado con éxito",
      response,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Error al desactivar el producto" });
  }
};

const getAtributosProById = async (req, res) => {
  try {
    const pro_id = req.params.pro_id;
    const response = await db.one(
      `SELECT  pro.pro_valor_iva, pro.pro_pvp 
        FROM producto pro 
        WHERE pro_id = $1 AND pro.pro_estado= true;`,
      [pro_id]
    );
    res.json(response);
  } catch (error) {
    console.log(error.Mensaje);
    res.json({ Mensaje: error.Mensaje });
  }
};

const putUpdateProducto = async (req, res) => {
  try {
    let {
      aud_usuario,
      pro_id,
      pro_nombre,
      pro_descripcion,
      cat_id,
      pro_valor_iva,
      pro_costo,
      pro_pvp,
      pro_imagen,
      pro_estado,
    } = req.body;


    const response = await db.one(
      `UPDATE producto SET pro_nombre=$2, pro_descripcion=$3, cat_id=$4, pro_valor_iva=$5, 
        pro_costo=$6, pro_pvp=$7, pro_imagen=$8, pro_estado=$9 WHERE pro_id=$1 RETURNING*`,
      [
        pro_id,
        pro_nombre,
        pro_descripcion,
        cat_id,
        pro_valor_iva,
        pro_costo,
        pro_pvp,
        pro_imagen,
        pro_estado,
      ]
    );

    res.json({
      message: "Producto actualizado con éxito",
      response,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ message: error.message });
  }
};

const deleteProductoB = async (req, res) => {
  try {
    const pro_id = req.params.pro_id; // Obtén la ID del producto desde la ruta
    const response = await db.one(
      "DELETE FROM producto WHERE pro_id=$1 RETURNING *;",
      [pro_id]
    );
    res.json({
      message: "Producto eliminado con éxito",
      response,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Error al eliminar el producto" });
  }
};

module.exports = {
  getPrueba,
  updateProductoById,
  updateEstadoProductoById,
  getProductos,
  postCreateProducto,
  getProductosById,
  deleteProducto,
  getProductosByName,
  getAtributosProById,
  getProductosD,
  getProductosByIdD,
  getProductosByNameD,
  putUpdateProducto,
  deleteProductoB
};
