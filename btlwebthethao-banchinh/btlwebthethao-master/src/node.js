require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const connection = require('./config/connection.js'); // Import connection từ file connection.js

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

// Method override middleware - cập nhật để hỗ trợ cả query parameter
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method;
    delete req.body._method;
    return method;
  } 
  else if (req.query && '_method' in req.query) {
    // look in query string
    var method = req.query._method;
    return method;
  }
  // Để xử lý các phương thức HTTP thông qua X-HTTP-Method-Override header
  else if (req.headers['x-http-method-override']) {
    return req.headers['x-http-method-override'];
  }
  return undefined;
}));

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
app.use('/',eventroutes);
app.use('/',savednewsroutes);
app.use('/',categorynewsroutes);

// Admin routes should be mounted at /admin
app.use('/admin', adminRoutes);

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
