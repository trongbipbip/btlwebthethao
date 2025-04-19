require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const mysql = require('mysql2');

const app = express();

// Session middleware
app.use(session({
    secret: 'tennis-news-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Body parser middleware - MUST be before file upload middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Method override middleware
app.use(methodOverride('_method'));

// File upload middleware
app.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

// Static files middleware
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Debug middleware
app.use((req, res, next) => {
    console.log('=== Request Debug ===');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    console.log('===================');
    next();
});

// Routes
const authRoutes = require('./routes/User.js');
const adminRoutes = require('./routes/Admin.js');
const HomeRoutes = require('./routes/Home.js');
const newroutes = require('./routes/New.js');
const eventroutes = require('./routes/New.js');
const savednewsroutes = require('./routes/New.js');
const categorynewsroutes = require('./routes/New.js');


// Mount routes
app.use('/', authRoutes);
app.use('/', HomeRoutes);
app.use('/', newroutes);

// Admin routes should be mounted at /admin
app.use('/admin', adminRoutes);

// Database connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nodejs'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database successfully');
});

// 404 handler
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.url);
    res.status(404).send('404 Not Found');
});

// Error handler with detailed logging
app.use((err, req, res, next) => {
    console.error('=== Error Handler ===');
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    console.error('URL:', req.url);
    console.error('Method:', req.method);
    console.error('Body:', req.body);
    console.error('Session:', req.session);
    console.error('==================');
    
    res.status(500).send('Internal Server Error: ' + (err.message || 'Unknown error'));
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log('- GET /admin/login');
    console.log('- POST /admin/auth-admin');
    console.log('- GET /admin/home');
});
