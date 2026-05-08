const express = require('express');

const app = express();

const TOKEN = "X%BNY&9@1s8!A";

app.use(express.json());

app.get('/dados', (req, res) => {

    res.send("API funcionando");

});

app.post('/dados', (req, res) => {
    const token = req.headers['authorization'];

    if (token !== TOKEN) {
        return res.status(401).send("Token de autenticação inválido");
    }
    console.log("Dados recebidos:");
    console.log(req.body);

    res.send("OK");

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Servidor rodando na porta ${PORT}`);

});