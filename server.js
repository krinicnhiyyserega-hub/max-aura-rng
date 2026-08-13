const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Процесс хостинга сам подставит нужный порт

app.use(cors());
app.use(express.json());

// 🔥 Настройка под ваш GitHub: отдаем файлы прямо из корня проекта
app.use(express.static(__dirname));

// ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error('❌ Ошибка БД:', err.message);
    else console.log('📦 База данных SQLite подключена.');
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            score INTEGER DEFAULT 0,
            rolls INTEGER DEFAULT 0
        )
    `);
});

// ТОП-10 ИЗ БАЗЫ ДАННЫХ
app.get('/api/leaderboard', (req, res) => {
    const sql = `SELECT name, score, rolls FROM players ORDER BY score DESC LIMIT 10`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// СОХРАНЕНИЕ ОЧКОВ
app.post('/api/score', (req, res) => {
    const { name, score, rolls } = req.body;
    if (!name || score === undefined || rolls === undefined) {
        return res.status(400).json({ error: "Не все данные переданы" });
    }
    const sql = `
        INSERT INTO players (name, score, rolls) VALUES (?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET score = ?, rolls = ?
    `;
    db.run(sql, [name, score, rolls, score, rolls], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен и раздает файлы игры на порту ${PORT}`);
});
