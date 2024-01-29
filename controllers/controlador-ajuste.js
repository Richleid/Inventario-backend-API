const express = require('express')
const { db } = require('../cnn')

const getPrueba = (req, res) => {
  console.log('Funciona')
  res.send('Funciona el metodo de prueba ajuste')
}

const getAjuste = async (req, res) => {
  try {
    let response = [];
    const ajustes = await db.any(`SELECT aju_numero, aju_fecha, aju_descripcion, aju_estado FROM ajuste ORDER BY aju_numero;`);
    for (let ajuste of ajustes) {
      const detalles = await db.any(`SELECT ad.aju_det_id, ad.pro_id, ad.aju_det_cantidad, ad.aju_det_modificable, ad.aju_det_tipo, p.pro_nombre, p.pro_descripcion, p.cat_id, p.pro_valor_iva, p.pro_costo, p.pro_pvp, p.pro_imagen
                                      FROM ajuste_detalle ad
                                      JOIN producto p ON ad.pro_id = p.pro_id
                                      WHERE ad.aju_numero = $1;`, [ajuste.aju_numero]);
      for (let detalle of detalles) {
        const tipoAjuste = await db.oneOrNone(`SELECT tipo_id, tipo_nombre FROM tipo_ajuste WHERE tipo_id=$1;`, [detalle.aju_det_tipo]);
        detalle.tipo_ajuste = tipoAjuste || { tipo_id: null, tipo_nombre: 'Desconocido' }; // Si no hay tipo de ajuste, asigna un valor por defecto
      }
      ajuste.detalles = detalles;
      response.push(ajuste);
    }
    res.json(response);
  } catch (error) {
    console.log(error.message);
    res.json({ Mensaje: error.message });
  }
}

const getAjusteDetalles = async (req, res) => {
  try {
    // Obtener detalles de ajuste con el nombre del tipo de ajuste y el nombre del producto
    const detallesAjuste = await db.any(`
      SELECT ad.aju_det_id, ad.aju_numero, ad.pro_id, ad.aju_det_cantidad, ad.aju_det_modificable, ta.tipo_nombre, p.pro_nombre
      FROM ajuste_detalle ad
      JOIN tipo_ajuste ta ON ad.aju_det_tipo = ta.tipo_id
      JOIN producto p ON ad.pro_id = p.pro_id
      ORDER BY ad.aju_det_id;
    `);

    res.json(detallesAjuste);
  } catch (error) {
    console.error('Error al obtener detalles de ajuste simplificados:', error);
    res.status(500).json({ mensaje: "Error al obtener detalles de ajuste simplificados", error: error.message });
  }
};


/**
 * Obtiene el numero de ajuste que esta disponible 
 * y que continua con la secuencia
 * @param {*} res numero de ajuste
 */
const getAjusteNumero = async (req, res) => {
  try {
      const response = await db.one(`select get_nroAjuste();`)
      res.json(response)
  } catch (error) {
      console.log(error.message)
      res.json({ message: error.message })
  }
}

/**
* Permite crear un ajuste (cabecera)
* @param {*} req informacion de la cabecera del ajuste
*/
const postCreateAjuste = async (req, res) => {
  const { aju_fecha, aju_descripcion } = req.body
  try {
      const response = await db.one(`INSERT INTO public.ajuste(aju_numero, aju_fecha, aju_descripcion, aju_estado)
      VALUES (get_nroAjuste(), $1, $2, true) returning*;`, [aju_fecha, aju_descripcion])
      res.json(response)
  } catch (error) {
      console.log(error.message)
      res.json({ message: error.message })
  }
}


const postCreateDetalleAjuste = async (req, res) => {
  try {
    const { aju_numero, pro_id, aju_det_cantidad, aju_det_modificable, aju_det_tipo } = req.body;

    // Primero, inserta el detalle de ajuste
    const detalle = await db.one(`INSERT INTO public.ajuste_detalle (aju_numero, pro_id, aju_det_cantidad, aju_det_modificable, aju_det_tipo)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;`, [aju_numero, pro_id, aju_det_cantidad, aju_det_modificable, aju_det_tipo]);

    // Luego, obtén el tipo de ajuste ('incremento' o 'decremento')
    const tipoAjuste = await db.one(`SELECT tipo_nombre FROM tipo_ajuste WHERE tipo_id = $1;`, [aju_det_tipo]);

    // Actualiza el stock del producto basado en el tipo de ajuste
    const stockChange = tipoAjuste.tipo_nombre === 'incremento' ? aju_det_cantidad : -aju_det_cantidad;
    await db.none(`UPDATE producto SET pro_stock = pro_stock + $1 WHERE pro_id = $2`, [stockChange, pro_id]);

    res.json({
      Mensaje: "Detalle de ajuste creado con éxito y stock actualizado",
      detalle
    });
  } catch (error) {
    console.log(error);
    res.json({ Mensaje: error.message });
  }
};


const updateAjuste = async (req, res) => {
  const { aju_numero, aju_fecha, aju_descripcion, aju_estado} = req.body
  try {
    const response = db.none('UPDATE ajuste SET aju_fecha = $2, aju_descripcion = $3, aju_estado = $4 WHERE aju_numero = $1', 
    [aju_numero, aju_fecha, aju_descripcion, aju_estado])
    const resp = db.none('UPDATE ajuste_detalle SET aju_det_estado=$2 WHERE aju_numero=$1',[aju_numero,aju_estado])

    res.json({
      message: 'Ajuste con aju_numero:'+aju_numero+' actualizado'
    })
  } catch (error) {
    res.json({
      message: error.message
    })
  }
}

const updateAjusteDetalleById = async (req, res) => {
  const { aju_det_id, aju_det_modificable, aju_det_estado } = req.body;


  if (typeof aju_det_modificable !== 'boolean') {
    return res.status(400).json({
      Error: '9997',
      Mensaje: 'Revise aju_det_modificable.'
    });
  }

  if (typeof aju_det_estado !== 'boolean') {
    return res.status(400).json({
      Error: '9997',
      Mensaje: 'Revise aju_det_estado.'
    });
  }

  try {
    const updateQuery = `UPDATE ajuste_detalle SET aju_det_cantidad = $1, aju_det_modificable = $2, aju_det_estado = $3
        WHERE aju_det_id = $4`;

    const values = [aju_det_cantidad, aju_det_modificable, aju_det_estado, aju_det_id];

    await db.query(updateQuery, values);
    res.status(200).json({ message: 'Tabla ajuste_detalle actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar la tabla ajuste_detalle', error);
    res.status(500).json({ error: 'Error al actualizar la tabla ajuste_detalle' });
  }
};

const putUpdateAjuste = async (req, res) => {
  const {  aju_numero, aju_fecha, aju_descripcion, detalles } = req.body
  try {
    //Insercion del ajuste
    const ajuste = await db.one(`UPDATE public.ajuste SET   aju_fecha=$1, aju_descripcion=$2, aju_estado=true
              WHERE aju_numero=$3 RETURNING*;`, [aju_fecha, aju_descripcion, aju_numero])
    await db.none(`DELETE FROM public.ajuste_detalle WHERE aju_numero=$1;`, [aju_numero])
    //Insercion del detalle
    let response = [];
    for (let i = 0; i < detalles.length; i++) {
      const detalle = await db.one(`INSERT INTO public.ajuste_detalle(aju_numero, pro_id, aju_det_cantidad, 
                  aju_det_modificable, aju_det_estado) VALUES ($1, $2, $3, true, true) returning*;`,
        [ajuste.aju_numero, detalles[i].pro_id, detalles[i].aju_det_cantidad])
      response.push(detalle)
    }
    ajuste.aju_detalle = response
    res.json(ajuste)
  } catch (error) {
    console.log(error.message)
    res.json({ message: error.message })
  }
}

const updateAjusteDetalle = async (req, res) => {
  const { aju_numero } = req.params;
  console.log("Valor de aju_numero recibido en el backend:", aju_numero);
  try {
    // Actualiza el campo aju_det_modificable a false para cada ajuste de detalle relacionado con el ajuste específico
    await db.none(`UPDATE public.ajuste_detalle SET aju_det_modificable=false WHERE aju_numero=$1;`, [aju_numero]);
    
    // Obtenemos el ajuste con los detalles actualizados para enviar en la respuesta
    const ajuste = await db.one('SELECT * FROM public.ajuste WHERE aju_numero = $1;', [aju_numero]);
    const detalles = await db.any('SELECT * FROM public.ajuste_detalle WHERE aju_numero = $1;', [aju_numero]);
    ajuste.detalles = detalles;
    
    res.json(ajuste);
  } catch (error) {
    console.log(error.message);
    res.json({ message: error.message });
  }
};

const postCreateAjustecompleto = async (req, res) => {
  const { aju_fecha, aju_descripcion, detalles } = req.body;
  try {
    // Creación del ajuste (similar a tu implementación actual)
    const ajuste = await db.one(/* tu código de inserción para el ajuste */);

    // Iterar sobre cada detalle de ajuste y crearlos en la base de datos
    for (let detalle of detalles) {
      await db.one(/* tu código de inserción para cada detalle de ajuste */);

      // Actualizar el stock del producto basándose en el estado del detalle de ajuste
      const stockChange = detalle.aju_det_estado ? detalle.aju_det_cantidad : -detalle.aju_det_cantidad;
      await db.none(`UPDATE producto SET pro_stock = pro_stock + $1 WHERE pro_id = $2`, [stockChange, detalle.pro_id]);
    }

    // Devolver respuesta
    res.json(/* tu respuesta */);
  } catch (error) {
    console.log(error);
    res.json({
      message: 'Valores incorrectos'
    });
  }
};

module.exports = {
  getAjusteDetalles,
  getAjusteNumero,
  getAjuste, postCreateAjuste,
  updateAjusteDetalleById, 
  postCreateDetalleAjuste, 
  putUpdateAjuste, postCreateAjustecompleto,
  updateAjuste, updateAjusteDetalle
}