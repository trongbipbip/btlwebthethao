const path = require('path')
const express = require('express')

const configViewEngine = (app) => {
    // Thiết lập view engine là EJS
    app.set('view engine', 'ejs')
    
    // Thiết lập thư mục chứa views
    app.set('views', path.join('./src', 'views'))
    
    // Thiết lập thư mục public cho static files
    app.use(express.static(path.join('./src', 'public')))
}

module.exports = configViewEngine