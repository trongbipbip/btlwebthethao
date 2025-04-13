    const path = require('path')
    const express = require('express')
    const configViewEngine=(app) => {
        app.set('view engine', 'ejs')
        app.set('views', path.join('./src', 'views/login'))
        app.set('views', path.join('./src', 'views/admin'))
        app.use(express.static(path.join('./src', 'public')))
        app.set('views', path.join('./src', 'views'))
    }

    module.exports = configViewEngine