const { db } = require("../cnn")

const getVentas = async (req, res) => {
    try {
        const response = await db.any('SELECT * FROM venta;'); // Utilizamos db.any en lugar de db.manyOrNone
        res.json(response); // Enviamos directamente la respuesta sin envolverla en un objeto con 'ventas' como clave.
    } catch (error) {
        console.log(error.message); // Imprimir el mensaje de error
        res.status(500).json({ message: error.message }); // Responder con el mensaje de error
    }
}

const getVentaById = async (req, res) => {
    try {
        const { ven_id } = req.params
        const response = await db.one("SELECT * FROM venta WHERE ven_id=$1;", [ven_id])
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

const postVenta = async (req, res) => {
    const { cli_id, pro_id, ven_fecha, ven_cantidad, ven_total, ven_estado } = req.body;

    try {
        // Verificar stock disponible
        const stockProducto = await db.one("SELECT pro_stock FROM producto WHERE pro_id = $1", [pro_id]);
        
        if (stockProducto.pro_stock < ven_cantidad) {
            return res.status(400).json({ message: "No hay stock suficiente para realizar la venta" });
        }

        await db.tx(async t => {
            // Insertar la venta
            await t.one("INSERT INTO venta(cli_id, pro_id, ven_fecha, ven_cantidad, ven_total, ven_estado) VALUES($1, $2, $3, $4, $5, $6) RETURNING ven_id", [cli_id, pro_id, ven_fecha, ven_cantidad, ven_total, ven_estado]);

            // Actualizar el stock del producto
            await t.none("UPDATE producto SET pro_stock = pro_stock - $1 WHERE pro_id = $2", [ven_cantidad, pro_id]);
        });

        res.json({ message: "Venta realizada con éxito y stock actualizado" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error al realizar la venta y actualizar el stock" });
    }
};


const putVenta = async (req, res) => {
    const { ven_id, cli_id, pro_id, ven_fecha, ven_cantidad, ven_total, ven_estado } = req.body;
  
    // Verificar que los campos obligatorios estén presentes
    if (!ven_id) {
      return res.status(400).json({ mensaje: "Error", response: "El ID de la venta es requerido." });
    }
  
    try {
      // Obtener la venta actual para verificar cambios en la cantidad y el producto
      const ventaActual = await db.one("SELECT ven_cantidad, pro_id FROM venta WHERE ven_id=$1", [ven_id]);
      const { ven_cantidad: cantidadActual, pro_id: productoIdActual } = ventaActual;
  
      // Verificar si el nuevo producto es diferente y obtener su stock
      const productoIdParaStock = pro_id || productoIdActual;
      const stockProducto = await db.one("SELECT pro_stock FROM producto WHERE pro_id = $1", [productoIdParaStock]);
  
      // Calcular el nuevo stock disponible
      const stockDisponible = stockProducto.pro_stock + (pro_id === productoIdActual ? cantidadActual : 0);
  
      // Verificar que la cantidad no sea mayor que el stock disponible
      if (ven_cantidad > stockDisponible) {
        return res.status(400).json({ mensaje: "Error", response: "No hay stock suficiente para la venta." });
      }
  
      // Preparar la consulta de actualización con los campos proporcionados
      const updateFields = [];
      cli_id !== undefined && updateFields.push(`cli_id='${cli_id}'`);
      pro_id !== undefined && updateFields.push(`pro_id='${pro_id}'`);
      ven_fecha !== undefined && updateFields.push(`ven_fecha='${ven_fecha}'`);
      ven_cantidad !== undefined && updateFields.push(`ven_cantidad=${ven_cantidad}`);
      ven_total !== undefined && updateFields.push(`ven_total=${ven_total}`);
      ven_estado !== undefined && updateFields.push(`ven_estado=${ven_estado}`);
  
      // Unir todos los campos para la consulta
      const setClause = updateFields.join(', ');
  
      // Ejecutar la consulta de actualización
      await db.none(`UPDATE venta SET ${setClause} WHERE ven_id=$1`, [ven_id]);
  
      // Actualizar el stock del producto si la cantidad de la venta cambió y es el mismo producto
      if (ven_cantidad !== undefined && ven_cantidad !== cantidadActual && pro_id === productoIdActual) {
        const diferenciaStock = cantidadActual - ven_cantidad;
        await db.none("UPDATE producto SET pro_stock = pro_stock + $1 WHERE pro_id = $2", [diferenciaStock, productoIdParaStock]);
      }
  
      // Responder con el éxito de la operación
      return res.json({ mensaje: "Correcto", response: "Venta actualizada correctamente con id " + ven_id });
  
    } catch (error) {
      console.error('Error al actualizar la venta:', error);
      return res.status(500).json({ mensaje: "Error", response: "Error al procesar la solicitud: " + error.message });
    }
  };
  


const deleteVenta = async (req, res) => {
    try {
        const { ven_id } = req.params;

        await db.tx(async t => {
            // Obtener los detalles de la venta antes de eliminar
            const venta = await t.one("SELECT pro_id, ven_cantidad FROM venta WHERE ven_id=$1", [ven_id]);

            // Eliminar la venta
            await t.none("DELETE FROM venta WHERE ven_id=$1", [ven_id]);

            // Ajustar el stock del producto
            await t.none("UPDATE producto SET pro_stock = pro_stock + $1 WHERE pro_id = $2", [venta.ven_cantidad, venta.pro_id]);
        });

        res.json({ message: `Ok!! Venta con id ${ven_id} eliminada con éxito y stock restaurado` });
    } catch (error) {
        // Si la transacción falla, se maneja el error aquí
        console.log(error);
        res.status(500).json({ message: "Error al eliminar la venta" });
    }
};

module.exports = {
    getVentas,
    getVentaById,
    postVenta,
    putVenta,
    deleteVenta
}