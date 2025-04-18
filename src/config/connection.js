const mysql = require('mysql2'); // 

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'trong091204',
  database: 'nodejs'
});

// Kiểm tra và tạo bảng news nếu chưa tồn tại
connection.connect(async (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Successfully connected to database');

    try {
        await connection.promise().query(`
            CREATE TABLE IF NOT EXISTS news (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                author_id INT,
                status ENUM('pending', 'active', 'inactive') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES user(id)
            )
        `);
        console.log('News table checked/created successfully');

        // Kiểm tra xem có dữ liệu mẫu không
        const [rows] = await connection.promise().query('SELECT COUNT(*) as count FROM news');
        if (rows[0].count === 0) {
            // Thêm một số dữ liệu mẫu
            await connection.promise().query(`
                INSERT INTO news (title, content, author_id, status) VALUES 
                ('Tin tức tennis mới nhất', 'Nội dung tin tức tennis...', 1, 'active'),
                ('Giải đấu sắp diễn ra', 'Thông tin về giải đấu...', 1, 'pending'),
                ('Kết quả trận đấu', 'Chi tiết kết quả...', 1, 'active')
            `);
            console.log('Sample news data inserted');
        }
    } catch (error) {
        console.error('Error setting up database:', error);
    }
});

// Handle errors after initial connection
connection.on('error', function(err) {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
        console.error('Database connection was refused.');
    }
});

module.exports = connection; 