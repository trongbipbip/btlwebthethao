-- Cập nhật bảng suggestions để thêm cột user_id
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS user_id INT;
ALTER TABLE suggestions ADD CONSTRAINT fk_suggestions_user FOREIGN KEY (user_id) REFERENCES user(id);

-- Kiểm tra và tạo bảng suggestions nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS suggestions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  news_id INT NOT NULL,
  user_id INT,
  name VARCHAR(255),
  detail TEXT NOT NULL,
  status ENUM('Chưa xử lý', 'Đã xử lý') DEFAULT 'Chưa xử lý',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
); 