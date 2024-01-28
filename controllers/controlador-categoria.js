const { db } = require('../cnn')

const getCategorias = async (req, res) => {
    try {
        const response = await db.any('SELECT cat_id, cat_nombre FROM categoria WHERE cat_estado=true ORDER BY cat_id;')
        res.json(response)
    } catch (error) {
        console.log(error.message)
        res.json({ message: error.message })
    }
}

const getCategoriaById = async (req, res) => {
    try {
        const cat_id = req.params.cat_id
        const response = await db.any(`SELECT cat_id, cat_nombre FROM categoria WHERE cat_id = $1 
            AND cat_estado=true;`, [cat_id])
        res.json(response)
    } catch (error) {
        console.log(error.message)
        res.json({ message: error.message })
    }
}

const getCategoriaByName = async (req, res) => {
    try {
        const cat_nombre = req.params.cat_nombre
        const response = await db.any(`SELECT cat_id, cat_nombre FROM categoria WHERE cat_nombre = $1 
            AND cat_estado=true;`, [cat_nombre])
        res.json(response)
    } catch (error) {
        console.log(error.message)
        res.json({ message: error.message })
    }
}

const postCreateCategoria = async (req, res) => {
    try {
        const { cat_nombre } = req.body
        const response = await db.one(`INSERT INTO public.categoria (cat_nombre, cat_estado)
                                    VALUES ($1, true) returning*;`, [cat_nombre])
        return res.json({
            mensaje: 'Categoria creada con éxito',
            response: response
        })
    } catch (error) {
        console.log(error.message)
        res.json({ message: error.message })
    }
}

const updateCategoria = async (req, res) => {
    try {
        const cat_id = req.params.cat_id
        const { cat_nombre, cat_estado } = req.body
        const response = await db.any('UPDATE public.categoria SET cat_nombre=$2, cat_estado=$3 WHERE cat_id=$1 returning*',
            [cat_id, cat_nombre, cat_estado])
        return res.json({
            mensaje: 'Categoria actualizada',
            response: response
        })
    } catch (error) {
        console.log(error.message)
        res.json({ message: error.message })
    }
}

const deleteCategoria = async (req, res) => {
    try {
        const { cat_id } = req.body
        const response = await db.any('UPDATE public.categoria SET cat_estado=false WHERE cat_id=$1 returning*', [cat_id])
        return res.json({
            mensaje: 'Categoria desactivada',
            response: response
        })
    } catch (error) {
        console.log(error.message)
        res.json({ message: error.message })
    }

}

module.exports = {
    getCategorias,
    getCategoriaById,
    getCategoriaByName,
    postCreateCategoria,
    updateCategoria,
    deleteCategoria
}