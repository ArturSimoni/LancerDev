const express = require('express');
const pool = require('./db'); // Importa o arquivo de conexão
const app = express();

app.use(express.json()); 

app.get('/usuarios', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM usuarios');
        res.json(resultado.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor ao buscar dados');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
