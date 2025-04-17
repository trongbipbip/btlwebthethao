require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Basic middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session config
app.use(session({
    secret: '123456',
    resave: false,
    saveUninitialized: true
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Simple logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Test route
app.post('/test', (req, res) => {
    console.log('Test route hit');
    console.log('Request body:', req.body);
    res.json({ message: 'Test route working' });
});

// Simple route
app.get('/', (req, res) => {
    res.send('Server is working');
});

// Routes
const authRoutes = require('./routes/User.js');
const adminRoutes = require('./routes/Admin.js');
const HomeRoutes = require('./routes/Home.js');
const newroutes = require('./routes/New.js');

app.use('/', authRoutes);
app.use('/', HomeRoutes);
app.use('/', newroutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.path);
    res.status(404).send('404 Not Found');
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log('- POST /test');
    console.log('- POST /forgotpass-nor');
});
