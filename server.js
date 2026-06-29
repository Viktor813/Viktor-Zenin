// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // если хотите раздавать статику

// Инициализация базы данных
const db = new sqlite3.Database('./calculator.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err.message);
    } else {
        console.log('Подключено к SQLite базе данных');
        // Создание таблицы для истории вычислений
        db.run(`
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                expression TEXT NOT NULL,
                result TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
});

// API эндпоинты

// Получить всю историю
app.get('/api/history', (req, res) => {
    db.all('SELECT * FROM history ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Получить последние N записей
app.get('/api/history/last/:count', (req, res) => {
    const count = parseInt(req.params.count) || 10;
    db.all(
        'SELECT * FROM history ORDER BY created_at DESC LIMIT ?', [count],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// Сохранить новое вычисление
app.post('/api/history', (req, res) => {
    const { expression, result } = req.body;

    if (!expression || result === undefined) {
        res.status(400).json({ error: 'Expression and result are required' });
        return;
    }

    db.run(
        'INSERT INTO history (expression, result) VALUES (?, ?)', [expression, String(result)],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                id: this.lastID,
                expression,
                result: String(result),
                created_at: new Date().toISOString()
            });
        }
    );
});

// Удалить запись по ID
app.delete('/api/history/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.run('DELETE FROM history WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Record not found' });
            return;
        }
        res.json({ message: 'Record deleted successfully' });
    });
});

// Очистить всю историю
app.delete('/api/history', (req, res) => {
    db.run('DELETE FROM history', function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Сброс автоинкремента
        db.run('DELETE FROM sqlite_sequence WHERE name = "history"');
        res.json({ message: 'All history cleared successfully' });
    });
});

// Получить статистику
app.get('/api/stats', (req, res) => {
    db.get(
        `SELECT 
            COUNT(*) as total_calculations,
            COUNT(DISTINCT expression) as unique_expressions,
            AVG(LENGTH(result)) as avg_result_length,
            MAX(created_at) as last_calculation
        FROM history`,
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(row);
        }
    );
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log('Доступные эндпоинты:');
    console.log('  GET    /api/history          - вся история');
    console.log('  GET    /api/history/last/:n  - последние N записей');
    console.log('  POST   /api/history          - сохранить вычисление');
    console.log('  DELETE /api/history/:id      - удалить запись');
    console.log('  DELETE /api/history          - очистить всю историю');
    console.log('  GET    /api/stats            - статистика');
});

// Обработка закрытия приложения
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Ошибка закрытия БД:', err.message);
        } else {
            console.log('База данных закрыта');
        }
        process.exit(0);
    });
});