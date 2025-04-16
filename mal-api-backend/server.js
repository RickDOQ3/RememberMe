const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const CACHE_DIR = path.join(__dirname, 'cached_users');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

// Garante que a pasta de cache exista
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR);
}

// Utilitário para buscar da API do MyAnimeList e salvar em cache
async function fetchAndCacheUser(username) {
    const response = await fetch(`https://api.myanimelist.net/v2/users/${username}/animelist?status=completed&limit=1000`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        }
    });

    if (!response.ok) throw new Error(`Erro ao buscar usuário na API: ${response.status}`);
    const data = await response.json();

    const filePath = path.join(CACHE_DIR, `${username}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return data;
}

// Rota principal do quiz
app.get('/quiz-data', async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ error: 'Usuário não fornecido.' });

    const filePath = path.join(CACHE_DIR, `${username}.json`);

    let data;

    try {
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            data = JSON.parse(fileContent);
        } else {
            // Cache não existe — buscar da API e salvar
            data = await fetchAndCacheUser(username);
        }

        const animeList = data.data.map(entry => entry.node);
        if (animeList.length < 4) {
            return res.status(400).json({ error: 'Usuário tem menos de 4 animes completados.' });
        }

        res.json(animeList);
    } catch (error) {
        console.error('Erro ao processar quiz-data:', error.message);
        res.status(500).json({ error: 'Erro interno ao obter dados do quiz.' });
    }
});

const recapturarDados = async (username) => {
    const userFile = path.join(CACHE_DIR, `${username}.json`);

    console.log(`🌐 Recapturando dados da API do MAL para ${username}...`);

    const response = await fetch(`https://api.myanimelist.net/v2/users/${username}/animelist?status=completed&limit=1000`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
    }

    const data = await response.json();

    fs.writeFileSync(userFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Novo cache salvo em ${userFile}`);

    return data;
};


app.get('/completed-animes', async (req, res) => {
    const username = req.query.username;

    if (!username) {
        return res.status(400).json({ error: 'Usuário não fornecido.' });
    }

    const userFile = path.join(CACHE_DIR, `${username}.json`);

    // Verifica se já existe o arquivo salvo localmente
    if (fs.existsSync(userFile)) {
        console.log(`🔁 Usando cache local para ${username}`);
        const data = fs.readFileSync(userFile, 'utf-8');
        return res.json(JSON.parse(data));
    }

    // Se não existir, busca na API do MAL
    try {
        console.log(`🌐 Buscando animes completados de ${username} na API do MAL...`);

        const response = await fetch(`https://api.myanimelist.net/v2/users/${username}/animelist?status=completed&limit=1000`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        const data = await response.json();

        // Salva os dados localmente
        fs.writeFileSync(userFile, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`✅ Cache salvo em ${userFile}`);

        res.json(data);
    } catch (error) {
        console.error('Erro no servidor:', error.message);
        res.status(500).send(`Erro: ${error.message}`);
    }
});

app.get('/recapture', async (req, res) => {
    const username = req.query.username;

    if (!username) {
        return res.status(400).json({ error: 'Usuário não fornecido.' });
    }

    const userFile = path.join(CACHE_DIR, `${username}.json`);

    try {
        if (fs.existsSync(userFile)) {
            fs.unlinkSync(userFile);
            console.log(`🗑️ Cache antigo deletado para ${username}`);
        }

        const data = await recapturarDados(username);
        res.json({ success: true, data });
    } catch (error) {
        console.error("Erro ao recapturar dados:", error.message);
        res.status(500).json({ error: "Erro ao recapturar dados." });
    }
});






app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
