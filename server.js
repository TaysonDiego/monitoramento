const express = require('express');
const admin = require('firebase-admin');

const app = express();

const TOKEN = "X%BNY&9@1s8!A";

app.use(express.json());

// ============================================================
// FIREBASE ADMIN
// ============================================================

try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        throw new Error(
            "Variável FIREBASE_SERVICE_ACCOUNT não configurada."
        );
    }

    const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT
    );

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log("Firebase Admin inicializado com sucesso.");

} catch (erro) {
    console.error(
        "Erro ao inicializar Firebase Admin:",
        erro.message
    );
}

// ============================================================
// GUARDA O ÚLTIMO DADO RECEBIDO DO ESP32
// ============================================================

let ultimoDado = null;

// Guarda o último estado dos alertas.
// Isso evita enviar várias notificações enquanto
// o ESP32 continua mandando o mesmo estado.

let ultimaPossivelQueda = 0;
let ultimaQuedaDetectada = 0;

// ============================================================
// ENVIA NOTIFICAÇÃO FCM
// ============================================================

async function enviarNotificacaoFCM(tipo) {

    try {

        if (!admin.apps.length) {
            console.log(
                "Firebase não está inicializado. Notificação não enviada."
            );

            return;
        }

        let titulo;
        let mensagem;

        if (tipo === "possivel_queda") {

            titulo = "⚠️ Possível queda";

            mensagem =
                "O relógio detectou um movimento que pode indicar uma queda.";

        } else if (tipo === "queda_detectada") {

            titulo = "🚨 QUEDA DETECTADA";

            mensagem =
                "O relógio detectou uma possível queda.";

        } else {

            return;
        }

        const mensagemFCM = {

            topic: "vital_sense_alertas",

            data: {
                tipo: tipo
            },

            android: {
                priority: "high"
            }
        };

        const resposta = await admin
            .messaging()
            .send(mensagemFCM);

        console.log(
            `Notificação FCM enviada: ${tipo}`
        );

        console.log(
            `ID da mensagem: ${resposta}`
        );

    } catch (erro) {

        console.error(
            `Erro ao enviar FCM (${tipo}):`,
            erro
        );
    }
}

// ============================================================
// TESTE DA API
// ============================================================

app.get('/', (req, res) => {

    res.send('API funcionando');

});

// ============================================================
// FLUTTER CONSULTA OS DADOS
// ============================================================

app.get('/dados', (req, res) => {

    if (ultimoDado === null) {

        return res.status(404).json({
            erro: "Nenhum dado recebido do relógio ainda"
        });

    }

    res.json(ultimoDado);

});

// ============================================================
// ESP32 ENVIA OS DADOS
// ============================================================

app.post('/dados', async (req, res) => {

    const token = req.headers['authorization'];

    // ========================================================
    // VERIFICA O TOKEN
    // ========================================================

    if (token !== TOKEN) {

        return res.status(401).json({
            erro: "Token de autenticação inválido"
        });

    }

    // ========================================================
    // GUARDA OS DADOS
    // ========================================================

    ultimoDado = req.body;

    console.log("\n========== DADOS RECEBIDOS ==========");
    console.log(ultimoDado);
    console.log("=====================================\n");

    // ========================================================
    // PEGA OS ESTADOS DE QUEDA
    // ========================================================

    const possivelQueda =
        Number(ultimoDado.Possivel_Queda || 0);

    const quedaDetectada =
        Number(ultimoDado.Queda_Detectada || 0);

    // ========================================================
    // POSSÍVEL QUEDA
    // ========================================================

    if (
        possivelQueda === 1 &&
        ultimaPossivelQueda === 0
    ) {

        ultimaPossivelQueda = 1;

        console.log(
            "⚠️ POSSÍVEL QUEDA DETECTADA!"
        );

        await enviarNotificacaoFCM(
            "possivel_queda"
        );

    }

    // Quando voltar para 0,
    // permite um novo alerta futuramente.

    if (possivelQueda === 0) {

        ultimaPossivelQueda = 0;

    }

    // ========================================================
    // QUEDA DETECTADA
    // ========================================================

    if (
        quedaDetectada === 1 &&
        ultimaQuedaDetectada === 0
    ) {

        ultimaQuedaDetectada = 1;

        console.log(
            "🚨 QUEDA DETECTADA!"
        );

        await enviarNotificacaoFCM(
            "queda_detectada"
        );

    }

    // Quando voltar para 0,
    // permite um novo alerta futuramente.

    if (quedaDetectada === 0) {

        ultimaQuedaDetectada = 0;

    }

    // ========================================================
    // RESPONDE AO ESP32
    // ========================================================

    res.status(200).json({

        sucesso: true,

        mensagem: "Dados recebidos com sucesso"

    });

});

// ============================================================
// SERVIDOR
// ============================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Servidor rodando na porta ${PORT}`
    );

});
