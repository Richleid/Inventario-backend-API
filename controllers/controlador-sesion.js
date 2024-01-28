const axios = require('axios')

const postDatosSesion = async (req, res) => {
    const { username, password } = req.body
    console.log(req.body)
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwODA0MzIxMzcwIiwiZXhwIjoxNjk0OTg1NDgyfQ.GljEqO4wDKT_x94OIQ76k2AraJUY4YKAwBFrfs-ZsMQ'
    if (!username) {
        return res.json({
            message: 'Campo de usuario vacio'
        })
    }
    if (!password) {
        return res.json({
            message: 'Campo de contraseña vacio'
        })
    }
    try {
        const response = await axios.get(
            `http://20.163.192.189:8080/api/login?user_username=${username}&user_password=${password}&mod_name=Inventario`,
            {
                headers: {
                    Authorization:
                        `Bearer ${jwt}`,
                },
            }
        )
        return res.json(response.data)
    } catch (error) {
        return res.json({
            message: "Solicitud erronea",
            error: error
        })
    }
}

module.exports = {
    postDatosSesion
}