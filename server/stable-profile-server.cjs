const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const PORT = 3002;
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Database connection
const db = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'sn4_db',
    user: 'postgres',
    password: '123'
});

// Проверяем подключение к БД
db.connect()
    .then(() => console.log('✅ База данных подключена'))
    .catch(err => console.error('❌ Ошибка БД:', err));

// Middleware для авторизации
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Неверный токен' });
        req.user = user;
        next();
    });
};

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        port: PORT,
        message: 'Stable Profile Server работает'
    });
});

// Profile API endpoints
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        
        const result = await db.query(`
            SELECT 
                u.id, u.username, u.email, u.full_name, u.phone, 
                u.position, u.department, u.location, u.bio, u.avatar,
                us.notification_email, us.notification_sms, us.theme, 
                us.language, us.privacy_settings,
                usl.social_links,
                ucl.custom_links
            FROM users u
            LEFT JOIN user_settings us ON u.id = us.user_id
            LEFT JOIN user_social_links usl ON u.id = usl.user_id  
            LEFT JOIN user_custom_links ucl ON u.id = ucl.user_id
            WHERE u.id = $1
        `, [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка получения профиля:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { 
            full_name, phone, position, department, 
            location, bio, avatar 
        } = req.body;
        
        const result = await db.query(`
            UPDATE users 
            SET full_name = $1, phone = $2, position = $3, 
                department = $4, location = $5, bio = $6, avatar = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *
        `, [full_name, phone, position, department, location, bio, avatar, userId]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.put('/api/profile/social', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { social_links } = req.body;
        
        await db.query(`
            INSERT INTO user_social_links (user_id, social_links)
            VALUES ($1, $2)
            ON CONFLICT (user_id)
            DO UPDATE SET social_links = $2, updated_at = CURRENT_TIMESTAMP
        `, [userId, JSON.stringify(social_links)]);
        
        res.json({ message: 'Социальные ссылки обновлены', social_links });
    } catch (error) {
        console.error('Ошибка обновления соц. ссылок:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.put('/api/profile/settings', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { 
            notification_email, notification_sms, theme, 
            language, privacy_settings 
        } = req.body;
        
        await db.query(`
            INSERT INTO user_settings (
                user_id, notification_email, notification_sms, 
                theme, language, privacy_settings
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id)
            DO UPDATE SET 
                notification_email = $2,
                notification_sms = $3,
                theme = $4,
                language = $5,
                privacy_settings = $6,
                updated_at = CURRENT_TIMESTAMP
        `, [userId, notification_email, notification_sms, theme, language, JSON.stringify(privacy_settings)]);
        
        res.json({ message: 'Настройки обновлены' });
    } catch (error) {
        console.error('Ошибка обновления настроек:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.put('/api/profile/password', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const { currentPassword, newPassword } = req.body;
        
        // Получаем текущий пароль
        const user = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        // Проверяем текущий пароль
        const isValidPassword = await bcrypt.compare(currentPassword, user.rows[0].password);
        
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Неверный текущий пароль' });
        }
        
        // Хешируем новый пароль
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // Обновляем пароль
        await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, userId]);
        
        res.json({ message: 'Пароль успешно обновлен' });
    } catch (error) {
        console.error('Ошибка смены пароля:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.get('/api/profile/stats', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        
        // Здесь можно добавить реальную статистику из других таблиц
        const stats = {
            profileViews: Math.floor(Math.random() * 1000),
            connectionsCount: Math.floor(Math.random() * 100),
            postsCount: Math.floor(Math.random() * 50),
            achievementsCount: Math.floor(Math.random() * 20),
            lastLogin: new Date(),
            accountAge: '2 года'
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обработка ошибок
app.use((error, req, res, next) => {
    console.error('Глобальная ошибка:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log('🚀 Stable Profile Server запущен!');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log('📋 Profile API готов к работе');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Получен SIGTERM, завершаем работу...');
    db.end();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Получен SIGINT, завершаем работу...');
    db.end();
    process.exit(0);
});
