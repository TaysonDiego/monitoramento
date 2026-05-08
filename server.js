const express = require('express');

const app = express();

app.use(express.json());

app.get('/dados', (req, res) => {

    res.send("API funcionando");

});

app.post('/dados', (req, res) => {

    console.log("Dados recebidos:");
    console.log(req.body);

    res.send("OK");

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Servidor rodando na porta ${PORT}`);

});