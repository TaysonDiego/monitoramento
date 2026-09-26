const express = require('express');

const app = express();

const TOKEN = "X%BNY&9@1s8!A";

app.use(express.json());

// Guarda o último dado recebido do ESP32
let ultimoDado = null;

// ==========================================
// TESTE DA API
// ==========================================
app.get('/', (req, res) => {
    res.send('API funcionando');
});

// ==========================================
// FLUTTER CONSULTA OS DADOS
// ==========================================
app.get('/dados', (req, res) => {

    if (ultimoDado === null) {
        return res.status(404).json({
            erro: "Nenhum dado recebido do relógio ainda"
        });
    }

    // Retorna o último JSON recebido
    res.json(ultimoDado);
});

// ==========================================
// ESP32 ENVIA OS DADOS
// ==========================================
app.post('/dados', (req, res) => {

    const token = req.headers['authorization'];

    // Verifica o token
    if (token !== TOKEN) {
        return res.status(401).json({
            erro: "Token de autenticação inválido"
        });
    }

    // Guarda os dados recebidos
    ultimoDado = req.body;

    console.log("\n========== DADOS RECEBIDOS ==========");
    console.log(ultimoDado);
    console.log("=====================================\n");

    // Responde ao ESP32
    res.status(200).json({
        sucesso: true,
        mensagem: "Dados recebidos com sucesso"
    });
});

// ==========================================
// SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
