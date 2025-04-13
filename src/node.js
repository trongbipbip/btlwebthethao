const express = require('express');
const session = require('express-session');
const authRoutes = require('./routes/User.js');
const adminRoutes = require('./routes/Admin.js');
const configViewEngine = require('./config/viewConfig.js');
const app = express();

configViewEngine(app);

// Middleware
app.use(express.json()) // for json
app.use(express.urlencoded({ extended: true }))

// Session
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Trang chủ
app.get('/', (req, res) => {
    res.render('index.ejs');
});

// Các route xử lý đăng nhập
app.use('/', authRoutes);

// route admin

app.use('/admin', adminRoutes);
// Khởi chạy server
app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});
