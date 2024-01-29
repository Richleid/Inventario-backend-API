const express = require('express')
const { db } = require('../cnn')

const getPrueba = (req, res) => {
  console.log('Funciona')
  res.send('Funciona el metodo de prueba tipo ajuste')
}

const getTipoAjustes = async (req, res) => {
    try {
        const response = await db.any('SELECT tipo_id, tipo_nombre FROM tipo_ajuste;');
        res.json(response);
    } catch (error) {
        console.log(error.message);
        res.json({ message: error.message });
    }
}

const getTipoAjusteById = async (req, res) => {
    try {
        const tipo_id = req.params.tipo_id;
        const response = await db.one('SELECT tipo_id, tipo_nombre FROM tipo_ajuste WHERE tipo_id = $1;', [tipo_id]);
        res.json(response);
    } catch (error) {
        console.log(error.message);
        res.status(404).json({ message: "Tipo de ajuste no encontrado." });
    }
}

const getTipoAjusteByName = async (req, res) => {
    try {
        const tipo_nombre = req.params.tipo_nombre;
        const response = await db.any('SELECT tipo_id, tipo_nombre FROM tipo_ajuste WHERE tipo_nombre ILIKE $1;', [`%${tipo_nombre}%`]);
        // ILIKE se utiliza para una búsqueda insensible a mayúsculas y minúsculas.
        // Los signos de porcentaje (%) son comodines que permiten coincidir con cualquier secuencia de caracteres.

        // Si esperas un solo registro, puedes usar db.oneOrNone para manejar el caso de no encontrar resultados.
        // const response = await db.oneOrNone('SELECT tipo_id, tipo_nombre FROM tipoajuste WHERE tipo_nombre ILIKE $1;', [`%${tipo_nombre}%`]);

        if (response.length > 0) {
            res.json(response);
        } else {
            res.status(404).json({ message: "Tipo de ajuste no encontrado" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Error al buscar el tipo de ajuste por nombre" });
    }
}

const updateTipoAjuste = async (req, res) => {
    try {
        const tipo_id = req.params.tipo_id;
        const { tipo_nombre } = req.body;
        const response = await db.none('UPDATE tipo_ajuste SET tipo_nombre = $1 WHERE tipo_id = $2;', [tipo_nombre, tipo_id]);
        res.json({ message: 'Tipo de ajuste actualizado con éxito.' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getTipoAjustes,
    getTipoAjusteById,
    getTipoAjusteByName,
    updateTipoAjuste
}
