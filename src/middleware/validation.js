const { body } = require('express-validator');

exports.registerValidation = [
    body('fullName')
        .notEmpty().withMessage('Họ tên không được để trống'),

    body('username')
        .notEmpty().withMessage('Tên đăng nhập không được để trống'),
    
    body('email')
        .notEmpty().withMessage('Email không được để trống')
        .isEmail().withMessage('Email không hợp lệ'),

    body('password')
        .notEmpty().withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
];


    

exports.loginValidation = [
        body('username')
            .notEmpty().withMessage('Vui lòng nhập tên đăng nhập hoặc email'),
    
        body('password')
            .notEmpty().withMessage('Vui lòng nhập mật khẩu')
    ];




