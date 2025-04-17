const express = require('express');
const session = require('express-session');
const authRoutes = require('./routes/User.js');
const adminRoutes = require('./routes/Admin.js');
const configViewEngine = require('./config/viewConfig.js');
const HomeRoutes = require('./routes/Home.js');
const app = express();
const newroutes = require('./routes/New.js');
const bodyParser = require('body-parser');

configViewEngine(app);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: '123456',
    resave: false,
    saveUninitialized: true
}));

app.use('/', HomeRoutes);
app.use('/', authRoutes);
app.use('/', newroutes);

app.use('/admin', adminRoutes);
// Khởi chạy server
app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});
