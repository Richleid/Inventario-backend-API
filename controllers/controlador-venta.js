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
    try {
        const { ven_id, cli_id, pro_id, ven_fecha, ven_cantidad, ven_total, ven_estado } = req.body;

        // Obtener la cantidad actual de la venta antes de actualizar
        const ventaActual = await db.one("SELECT ven_cantidad, pro_id FROM venta WHERE ven_id=$1", [ven_id]);
        const cantidadActual = ventaActual.ven_cantidad;
        const productoIdActual = ventaActual.pro_id;

        // Verificar el stock disponible
        const stockProducto = await db.one("SELECT pro_stock FROM producto WHERE pro_id = $1", [pro_id || productoIdActual]);
        const stockDisponible = stockProducto.pro_stock + cantidadActual; // Stock actual más lo que se había vendido antes

        if (ven_cantidad > stockDisponible) {
            return res.status(400).json({ message: "No hay stock suficiente para actualizar la venta" });
        }

        // Preparar la consulta de actualización
        let query = "UPDATE venta SET ";
        cli_id && (query += "cli_id='" + cli_id + "', ");
        pro_id && (query += "pro_id='" + pro_id + "', ");
        ven_fecha && (query += "ven_fecha='" + ven_fecha + "', ");
        (ven_cantidad || ven_cantidad === 0) && (query += "ven_cantidad=" + ven_cantidad + ", ");
        ven_total && (query += "ven_total=" + ven_total + ", ");
        (typeof ven_estado !== 'undefined') && (query += "ven_estado=" + ven_estado + ", ");

        // Remover la última coma
        query = query.slice(0, -2);

        // Añadir la cláusula WHERE
        query += " WHERE ven_id=$1";

        // Actualizar la venta
        await db.none(query, [ven_id]);

        // Ajustar el stock solo si la cantidad de la venta o el producto ha cambiado
        if (ven_cantidad && ven_cantidad !== cantidadActual) {
            const diferencia = cantidadActual - ven_cantidad; // La diferencia podría ser negativa si se vendieron más productos
            await db.none("UPDATE producto SET pro_stock = pro_stock + $1 WHERE pro_id = $2", [diferencia, pro_id || productoIdActual]);
        }

        res.json({ message: "Ok!! La venta fue actualizada correctamente." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error al actualizar la venta" });
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