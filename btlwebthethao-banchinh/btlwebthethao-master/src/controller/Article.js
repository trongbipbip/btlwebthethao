const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const connection = require('../config/connection.js');
const viewConfig = require('../config/viewConfig.js'); 
const { connect } = require('../routes/Admin.js');


exports.showNewLogin = (req, res) => {
    // Lấy tất cả categories để hiển thị trong header
    connection.query('SELECT * FROM categories ORDER BY name', (error, categories) => {
        if (error) {
            console.error("Lỗi truy vấn danh mục:", error);
            return res.render('category-news', { 
                error: 'Lỗi khi tải danh mục',
                categories: [], // Truyền mảng rỗng nếu có lỗi
                user: req.session.user || null 
            });
        }
        
        res.render('category-news', { 
            error: null,
            categories: categories, // Truyền danh sách categories vào view
            user: req.session.user || null 
        });
    });
};


exports.showHome = (req, res) => {
    // Lấy tất cả categories để hiển thị trong header
    connection.query('SELECT * FROM categories ORDER BY name', (error, categories) => {
        if (error) {
            console.error("Lỗi truy vấn danh mục:", error);
            return res.render('index', { 
                error: 'Lỗi khi tải danh mục',
                categories: [], // Truyền mảng rỗng nếu có lỗi
                user: req.session.user || null 
            });
        }
        
        res.render('index', { 
            error: null,
            categories: categories, // Truyền danh sách categories vào view
            user: req.session.user || null 
        });
    });
};

exports.showcategorytournament = (req, res) => {
    try {
        // Fetch categories
        connection.query('SELECT * FROM categories', (err, categories) => {
            if (err) {
                console.error('Error fetching categories:', err);
                categories = [];
            }
            
            // Truy vấn tất cả giải đấu với đầy đủ thông tin
            const tournamentQuery = `
                SELECT id, name, image, more, total, website, location, surface, status, prize, background, content
                FROM tournaments
                ORDER BY status DESC, id DESC
            `;
            
            connection.query(tournamentQuery, (tournamentErr, tournamentResults) => {
                if (tournamentErr) {
                    console.error('Error fetching tournaments:', tournamentErr);
                    console.error('Chi tiết lỗi:', tournamentErr.message);
                    tournamentResults = [];
                }
                
                // Đảm bảo tournamentResults là mảng
                tournamentResults = tournamentResults || [];
                console.log(`Số lượng giải đấu tìm thấy: ${tournamentResults.length}`);
                if (tournamentResults.length > 0) {
                    console.log('Dữ liệu tournament đầu tiên:', tournamentResults[0]);
                }
                
                // Group tournaments by status
                const tournamentsByYear = {};
                
                // Nếu có giải đấu, nhóm theo trạng thái
                if (tournamentResults.length > 0) {
                    tournamentResults.forEach(tournament => {
                        let status = 'Khác';
                        
                        // Xử lý trường more để trích xuất ngày bắt đầu và kết thúc
                        if (tournament.more) {
                            try {
                                // Nếu more là chuỗi JSON, phân tích nó
                                let moreData = tournament.more;
                                if (typeof moreData === 'string') {
                                    try {
                                        moreData = JSON.parse(moreData);
                                    } catch (e) {
                                        // Nếu không phải JSON, xử lý như chuỗi thông thường
                                        console.log('more không phải JSON, xử lý như chuỗi thông thường');
                                    }
                                }
                                
                                // Kiểm tra nếu more là object và có thuộc tính date
                                if (typeof moreData === 'object' && moreData !== null) {
                                    if (moreData.start_date) {
                                        tournament.start_date = moreData.start_date;
                                    }
                                    if (moreData.end_date) {
                                        tournament.end_date = moreData.end_date;
                                    }
                                } else if (typeof tournament.more === 'string') {
                                    // Thử trích xuất từ chuỗi với định dạng thông thường như "Từ 15/07/2023 đến 30/07/2023"
                                    const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g;
                                    const dates = tournament.more.match(datePattern);
                                    
                                    if (dates && dates.length >= 2) {
                                        // Giả sử ngày đầu tiên là ngày bắt đầu, thứ hai là ngày kết thúc
                                        tournament.start_date = new Date(dates[0].replace(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/, '$3-$2-$1'));
                                        tournament.end_date = new Date(dates[1].replace(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/, '$3-$2-$1'));
                                    } else if (dates && dates.length === 1) {
                                        // Nếu chỉ có 1 ngày, đặt nó làm ngày bắt đầu
                                        tournament.start_date = new Date(dates[0].replace(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/, '$3-$2-$1'));
                                    } else {
                                        // Thử tìm định dạng "dd tháng mm, yyyy" 
                                        // Ví dụ: "30 tháng 6, 2025 - 13 tháng 7, 2025"
                                        const vietnameseDatePattern = /(\d{1,2})\s+tháng\s+(\d{1,2}),\s+(\d{4})/g;
                                        let match;
                                        const vietnameseDates = [];
                                        
                                        // Tìm tất cả các ngày trong định dạng tiếng Việt
                                        while ((match = vietnameseDatePattern.exec(tournament.more)) !== null) {
                                            // match[1] = ngày, match[2] = tháng, match[3] = năm
                                            const dateObj = new Date(`${match[3]}-${match[2]}-${match[1]}`);
                                            vietnameseDates.push(dateObj);
                                        }
                                        
                                        // Nếu tìm thấy đủ 2 ngày (bắt đầu và kết thúc)
                                        if (vietnameseDates.length >= 2) {
                                            tournament.start_date = vietnameseDates[0];
                                            tournament.end_date = vietnameseDates[1];
                                        } else if (vietnameseDates.length === 1) {
                                            tournament.start_date = vietnameseDates[0];
                                        }
                                        
                                        // Nếu vẫn không tìm thấy, thử tìm với định dạng có dấu phân cách "|"
                                        // Ví dụ: "Wimbledon, Luân Đôn, Anh | 30 tháng 6, 2025 - 13 tháng 7, 2025"
                                        if (vietnameseDates.length === 0 && tournament.more.includes('|')) {
                                            const parts = tournament.more.split('|');
                                            if (parts.length >= 2) {
                                                const datePart = parts[1].trim();
                                                
                                                // Tìm trong phần sau dấu |
                                                const dateRange = datePart.split('-');
                                                if (dateRange.length >= 2) {
                                                    const startDateStr = dateRange[0].trim();
                                                    const endDateStr = dateRange[1].trim();
                                                    
                                                    // Phân tích ngày bắt đầu
                                                    const startMatch = /(\d{1,2})\s+tháng\s+(\d{1,2}),\s+(\d{4})/.exec(startDateStr);
                                                    if (startMatch) {
                                                        // startMatch[1] = ngày, startMatch[2] = tháng, startMatch[3] = năm
                                                        tournament.start_date = new Date(`${startMatch[3]}-${startMatch[2]}-${startMatch[1]}`);
                                                    }
                                                    
                                                    // Phân tích ngày kết thúc
                                                    const endMatch = /(\d{1,2})\s+tháng\s+(\d{1,2}),\s+(\d{4})/.exec(endDateStr);
                                                    if (endMatch) {
                                                        // endMatch[1] = ngày, endMatch[2] = tháng, endMatch[3] = năm
                                                        tournament.end_date = new Date(`${endMatch[3]}-${endMatch[2]}-${endMatch[1]}`);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch (parseError) {
                                console.error('Lỗi phân tích trường more:', parseError);
                            }
                        }
                        
                        // Xác định trạng thái để nhóm
                        if (tournament.status) {
                            status = tournament.status;
                        } else if (tournament.start_date) {
                            // Fallback nếu có ngày bắt đầu
                            const startDate = new Date(tournament.start_date);
                            const now = new Date();
                            
                            if (startDate > now) {
                                status = 'Sắp diễn ra';
                            } else {
                                status = 'Đã kết thúc';
                            }
                        }
                        
                        // Tạo nhóm nếu chưa tồn tại
                        if (!tournamentsByYear[status]) {
                            tournamentsByYear[status] = [];
                        }
                        
                        tournamentsByYear[status].push(tournament);
                    });
                } else {
                    // Nếu không có giải đấu nào, tạo dữ liệu mẫu để hiển thị
                    console.log("Không tìm thấy giải đấu, tạo dữ liệu mẫu để hiển thị UI");
                    
                    tournamentsByYear['Đang hoạt động'] = [
                        {
                            id: 1,
                            name: 'Wimbledon 2024',
                            location: 'London, UK',
                            image: '/assets/img/atp1000.png',
                            surface: 'Cỏ',
                            prize: '$2,500,000',
                            status: 'Đang hoạt động'
                        },
                        {
                            id: 2,
                            name: 'Roland Garros 2024',
                            location: 'Paris, France',
                            image: '/assets/img/atp500.png',
                            surface: 'Đất sét',
                            prize: '$1,800,000',
                            status: 'Đang hoạt động'
                        }
                    ];
                    
                    tournamentsByYear['Sắp diễn ra'] = [
                        {
                            id: 3,
                            name: 'US Open 2024',
                            location: 'New York, USA',
                            image: '/assets/img/atp250.png',
                            surface: 'Cứng',
                            prize: '$3,000,000',
                            status: 'Sắp diễn ra'
                        }
                    ];
                }
                
                // Fetch latest news for the sidebar
                connection.query(
                    'SELECT id, title, image_url FROM news ORDER BY created_at DESC LIMIT 4',
                    (newsErr, latestNews) => {
                        if (newsErr) {
                            console.error('Error fetching latest news:', newsErr);
                            latestNews = [];
                        }
                        
                        // Đảm bảo latestNews là mảng
                        latestNews = latestNews || [];
                        
                        // Render template với dữ liệu
                        res.render('category-tournament', { 
                            categories: categories || [],
                            tournaments: tournamentsByYear,
                            latestNews: latestNews,
                            user: req.session.user || null
                        });
                    }
                );
            });
        });
    } catch (error) {
        console.error('Error in showcategorytournament:', error);
        // Trong trường hợp lỗi, render trang với dữ liệu rỗng nhưng đảm bảo các biến đều tồn tại
        res.render('category-tournament', {
            categories: [],
            tournaments: {}, 
            latestNews: [],
            user: req.session.user || null
        });
    }
};

exports.showcategorynews = async (req, res) => {
    try {
        // Lấy category id từ query parameter nếu có
        const categoryId = req.query.id;
        
        // Đầu tiên, luôn lấy tất cả categories cho menu dropdown 
        connection.query('SELECT * FROM categories ORDER BY name', (categoriesError, allCategories) => {
            if (categoriesError) {
                console.error("Lỗi truy vấn danh mục:", categoriesError);
                return res.status(500).send('Lỗi server');
            }
            
            // Nếu có category id, lấy thông tin category đó
            if (categoryId) {
                connection.query(
                    `SELECT * FROM categories WHERE id = ?`, 
                    [categoryId], 
                    (error, results) => {
                        if (error || results.length === 0) {
                            console.error("Lỗi truy vấn hoặc không tìm thấy danh mục", error);
                            return res.status(404).send('Danh mục không tồn tại');
                        }
                        
                        const category = results[0];
                        // Lấy các bài viết thuộc category này
                        connection.query(
                            `SELECT * FROM news WHERE category_id = ? ORDER BY date DESC`, 
                            [categoryId], 
                            (newsError, newsResults) => {
                                if (newsError) {
                                    console.error("Lỗi truy vấn tin tức:", newsError);
                                    return res.status(500).send('Lỗi server');
                                }
                                
                                return res.render('category-news', {
                                    category: category,
                                    articles: newsResults,
                                    categories: allCategories, // Thêm danh sách tất cả categories
                                    user: req.session.user || null
                                });
                            }
                        );
                    }
                );
            } 
            // Nếu không có category id, lấy tất cả bài viết
            else {
                // Lấy tất cả bài viết, sắp xếp theo ngày
                connection.query(
                    `SELECT news.*, categories.name as category_name 
                     FROM news 
                     JOIN categories ON news.category_id = categories.id 
                     ORDER BY news.date DESC`,
                    [],
                    (newsError, newsResults) => {
                        if (newsError) {
                            console.error("Lỗi truy vấn tin tức:", newsError);
                            return res.status(500).send('Lỗi server');
                        }
                        
                        return res.render('category-news', {
                            categories: allCategories,
                            articles: newsResults,
                            user: req.session.user || null
                        });
                    }
                );
            }
        });
    } catch (err) {
        console.error('Lỗi trong showcategorynews:', err);
        return res.status(500).send('Lỗi server');
    }
};

exports.showsavednews = (req, res) => {
    const userId = req.session.user ? req.session.user.id : null;
    
    console.log("======= SAVED NEWS DEBUG =======");
    console.log("User session:", req.session);
    console.log("User ID:", userId);

    // Lấy tất cả danh mục để hiển thị trong header
    connection.query('SELECT * FROM categories ORDER BY name', (categoriesError, allCategories) => {
        if (categoriesError) {
            console.error("Lỗi truy vấn danh mục:", categoriesError);
            // Even if categories fail, try to render the page, maybe without categories
            allCategories = []; // Set to empty array if failed
        }

        if (!userId) {
            // User is not logged in, render the page with message
            console.log("User not logged in. Rendering saved-news page without saved articles.");
            return res.render('saved-news', {
                error: null, // No data fetching error, just not logged in
                categories: allCategories,
                user: null,
                savedNews: [] // Pass empty array
            });
        }

        // Modify the query to handle potential missing categories with LEFT JOIN
        const savedNewsQuery = `
            SELECT news.*, categories.name as category_name, saved_news.saved_at
            FROM saved_news 
            JOIN news ON saved_news.news_id = news.id 
            LEFT JOIN categories ON news.category_id = categories.id
            WHERE saved_news.user_id = ? 
            ORDER BY saved_news.saved_at DESC
        `;
        
        console.log("Executing query:", savedNewsQuery);
        console.log("With userId:", userId);

        connection.query(savedNewsQuery, [userId], (savedNewsError, savedNewsResults) => {
            if (savedNewsError) {
                console.error("Lỗi truy vấn tin tức đã lưu (chi tiết):", savedNewsError);
                
                // Try a simpler query just to get IDs
                const simpleQuery = "SELECT * FROM saved_news WHERE user_id = ?";
                connection.query(simpleQuery, [userId], (simpleError, simpleResults) => {
                    console.log("Simple saved_news query results:", simpleError || simpleResults);
                    
                    return res.render('saved-news', { 
                        error: 'Lỗi khi tải tin tức đã lưu: ' + savedNewsError.message,
                        categories: allCategories, 
                        user: req.session.user,
                        savedNews: [] // Pass empty array on error
                    });
                });
                return;
            }

            console.log(`Fetched ${savedNewsResults.length} saved news articles:`, savedNewsResults);
            
            // Check if the results have the required fields
            if (savedNewsResults.length > 0) {
                console.log("First saved news item:", savedNewsResults[0]);
            }
            
            res.render('saved-news', {
                error: null,
                categories: allCategories,
                user: req.session.user,
                savedNews: savedNewsResults // Pass the fetched saved news
            });
        });
    });
};

exports.showNewdetail = async (req, res) => {
    try {
        const articleId = req.query.id;
        
        if (!articleId) {
            console.error("Không có ID bài viết");
            return res.status(400).send('Thiếu ID bài viết');
        }

        console.log("Đang tìm bài viết với ID:", articleId);
        console.log("Path:", req.path); // Log đường dẫn để debug

        // Lấy tất cả danh mục để hiển thị trong header
        connection.query('SELECT * FROM categories ORDER BY name', (categoriesError, allCategories) => {
            if (categoriesError) {
                console.error("Lỗi truy vấn danh mục:", categoriesError);
                return res.status(500).send('Lỗi server');
            }

            // Cập nhật lượt xem
            connection.query('UPDATE news SET views = views + 1 WHERE id = ?', [articleId], (updateError) => {
                if (updateError) {
                    console.error("Lỗi cập nhật lượt xem:", updateError);
                    // Tiếp tục xử lý để hiển thị bài viết ngay cả khi không cập nhật được lượt xem
                }
                
                // Đảm bảo lấy toàn bộ nội dung không bị cắt ngắn
                connection.query(
                    'SELECT * FROM news WHERE id = ?', 
                    [articleId], 
                    (error, results) => {
                        if (error) {
                            console.error("Lỗi truy vấn database:", error);
                            return res.status(500).send('Lỗi khi truy vấn database');
                        }
                        
                        if (results.length === 0) {
                            console.error("Không tìm thấy bài viết với ID:", articleId);
                            return res.status(404).send('Bài viết không tồn tại');
                        }
                        
                        const article = results[0];
                        console.log("Đã tìm thấy bài viết:", article.title);
                        
                        // Lấy thông tin category (nếu cần)
                        connection.query(
                            'SELECT name FROM categories WHERE id = ?',
                            [article.category_id],
                            (catError, catResults) => {
                                if (!catError && catResults.length > 0) {
                                    article.category_name = catResults[0].name;
                                } else {
                                    article.category_name = 'Chưa phân loại';
                                }
                                
                                // Lấy tất cả góp ý đã xử lý cho bài viết này
                                const processedSuggestionsQuery = `
                                    SELECT * FROM suggestions 
                                    WHERE news_id = ? AND status = 'Đã xử lý'
                                    ORDER BY created_at DESC
                                `;
                                
                                console.log("SQL query for processed suggestions:", processedSuggestionsQuery);
                                console.log("Article ID:", articleId);

                                // Kiểm tra xem có dữ liệu suggestions nào không
                                connection.query('SELECT COUNT(*) as count FROM suggestions WHERE news_id = ?', [articleId], (countError, countResult) => {
                                    if (countError) {
                                        console.error("Lỗi đếm góp ý:", countError);
                                    } else {
                                        console.log("Số góp ý cho bài viết này:", countResult[0].count);
                                        
                                        // Nếu không có góp ý nào, tạo dữ liệu mẫu để kiểm tra
                                        if (countResult[0].count === 0) {
                                            console.log("Không có góp ý. Tạo dữ liệu mẫu...");
                                            
                                            // Thêm dữ liệu mẫu trực tiếp, không sử dụng tham số mảng phức tạp
                                            const insertQuery = `
                                                INSERT INTO suggestions 
                                                (title, news_id, name, detail, status) 
                                                VALUES 
                                                ('Zverev chiến thắng 3-0', ${articleId}, 'admin', 'Bài viết rất hay, cần thêm thông tin về các ván đấu', 'Đã xử lý'),
                                                ('Zverev chiến thắng 3-0', ${articleId}, 'user1', 'Cần bổ sung thêm hình ảnh về trận đấu', 'Đã xử lý')
                                            `;
                                            
                                            // Thêm dữ liệu mẫu vào bảng suggestions
                                            connection.query(insertQuery, (insertError, insertResult) => {
                                                if (insertError) {
                                                    console.error("Lỗi thêm dữ liệu mẫu:", insertError);
                                                } else {
                                                    console.log("Đã thêm dữ liệu mẫu thành công:", insertResult);
                                                }
                                            });
                                        }
                                    }
                                });

                                connection.query(processedSuggestionsQuery, [articleId], (processedSuggestionError, processedSuggestionResults) => {
                                    // Hiển thị kết quả debug cho góp ý đã xử lý
                                    console.log("Processed suggestion query error:", processedSuggestionError);
                                    console.log("Góp ý đã xử lý:", processedSuggestionError ? "Lỗi" : processedSuggestionResults.length + " góp ý");
                                    if (processedSuggestionResults && processedSuggestionResults.length > 0) {
                                        console.log("First suggestion:", processedSuggestionResults[0]);
                                    }
                                    
                                    // Lấy góp ý của người dùng hiện tại cho bài viết này (nếu đã đăng nhập)
                                    const userId = req.session.user ? req.session.user.id : null;
                                    
                                    if (userId) {
                                        // Lấy góp ý của người dùng cho bài viết này
                                        const userSuggestionQuery = `
                                            SELECT * FROM suggestions 
                                            WHERE news_id = ? AND user_id = ? 
                                            ORDER BY created_at DESC
                                        `;
                                        
                                        connection.query(userSuggestionQuery, [articleId, userId], (suggestionError, suggestionResults) => {
                                            // Hiển thị kết quả debug cho góp ý của người dùng
                                            console.log("Góp ý của người dùng:", suggestionError ? "Lỗi" : suggestionResults.length + " góp ý");
                                            
                                            // Render trang với dữ liệu bài viết, danh sách categories và góp ý của người dùng
                                            return res.render('news-detail', {
                                                article: article,
                                                categories: allCategories,
                                                user: req.session.user,
                                                mySuggestions: suggestionError ? [] : suggestionResults,
                                                processedSuggestions: processedSuggestionError ? [] : processedSuggestionResults
                                            });
                                        });
                                    } else {
                                        // Người dùng chưa đăng nhập, vẫn hiển thị các góp ý đã xử lý
                                        return res.render('news-detail', {
                                            article: article,
                                            categories: allCategories,
                                            user: null,
                                            mySuggestions: [],
                                            processedSuggestions: processedSuggestionError ? [] : processedSuggestionResults
                                        });
                                    }
                                });
                            }
                        );
                    }
                );
            });
        });
    } catch (err) {
        console.error("Lỗi trong showNewdetail:", err);
        return res.status(500).send('Lỗi server');
    }
};


exports.showevent = async (req, res) => {
    try {
        const eventId = req.query.id;
        
        if (!eventId) {
            console.error("Không có ID giải đấu");
            return res.status(400).send('Thiếu ID giải đấu');
        }

        console.log("Đang tìm giải đấu với ID:", eventId);
        
        // Lấy tất cả danh mục để hiển thị trong header
        connection.query('SELECT * FROM categories ORDER BY name', (categoriesError, allCategories) => {
            if (categoriesError) {
                console.error("Lỗi truy vấn danh mục:", categoriesError);
                return res.status(500).send('Lỗi server');
            }

            // Truy vấn bảng tournaments với tên bảng đã được sửa
            connection.query(
                'SELECT * FROM tournaments WHERE id = ?',
                [eventId],
                (error, results) => {
                    if (error) {
                        console.error('Lỗi truy vấn database:', error);
                        return res.status(500).send('Lỗi khi truy vấn database');
                    }
                    
                    if (results.length === 0) {
                        console.error('Không tìm thấy giải đấu với ID:', eventId);
                        return res.status(404).send('Giải đấu không tồn tại');
                    }
                    
                    const event = results[0];
                    console.log("Đã tìm thấy giải đấu:", event.name || event.title);
                    
                    // Xử lý trường more để trích xuất ngày bắt đầu và kết thúc
                    if (event.more) {
                        try {
                            // Nếu more là chuỗi JSON, phân tích nó
                            let moreData = event.more;
                            if (typeof moreData === 'string') {
                                try {
                                    moreData = JSON.parse(moreData);
                                } catch (e) {
                                    // Nếu không phải JSON, xử lý như chuỗi thông thường
                                    console.log('more không phải JSON, xử lý như chuỗi thông thường');
                                }
                            }
                            
                            // Kiểm tra nếu more là object và có thuộc tính date
                            if (typeof moreData === 'object' && moreData !== null) {
                                if (moreData.start_date) {
                                    event.start_date = moreData.start_date;
                                }
                                if (moreData.end_date) {
                                    event.end_date = moreData.end_date;
                                }
                            } else if (typeof event.more === 'string') {
                                // Thử trích xuất từ chuỗi với định dạng thông thường như "Từ 15/07/2023 đến 30/07/2023"
                                const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g;
                                const dates = event.more.match(datePattern);
                                
                                if (dates && dates.length >= 2) {
                                    // Giả sử ngày đầu tiên là ngày bắt đầu, thứ hai là ngày kết thúc
                                    event.start_date = new Date(dates[0].replace(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/, '$3-$2-$1'));
                                    event.end_date = new Date(dates[1].replace(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/, '$3-$2-$1'));
                                } else if (dates && dates.length === 1) {
                                    // Nếu chỉ có 1 ngày, đặt nó làm ngày bắt đầu
                                    event.start_date = new Date(dates[0].replace(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/, '$3-$2-$1'));
                                } else {
                                    // Thử tìm định dạng "dd tháng mm, yyyy" 
                                    // Ví dụ: "30 tháng 6, 2025 - 13 tháng 7, 2025"
                                    const vietnameseDatePattern = /(\d{1,2})\s+tháng\s+(\d{1,2}),\s+(\d{4})/g;
                                    let match;
                                    const vietnameseDates = [];
                                    
                                    // Tìm tất cả các ngày trong định dạng tiếng Việt
                                    while ((match = vietnameseDatePattern.exec(event.more)) !== null) {
                                        // match[1] = ngày, match[2] = tháng, match[3] = năm
                                        const dateObj = new Date(`${match[3]}-${match[2]}-${match[1]}`);
                                        vietnameseDates.push(dateObj);
                                    }
                                    
                                    // Nếu tìm thấy đủ 2 ngày (bắt đầu và kết thúc)
                                    if (vietnameseDates.length >= 2) {
                                        event.start_date = vietnameseDates[0];
                                        event.end_date = vietnameseDates[1];
                                    } else if (vietnameseDates.length === 1) {
                                        event.start_date = vietnameseDates[0];
                                    }
                                    
                                    // Nếu vẫn không tìm thấy, thử tìm với định dạng có dấu phân cách "|"
                                    // Ví dụ: "Wimbledon, Luân Đôn, Anh | 30 tháng 6, 2025 - 13 tháng 7, 2025"
                                    if (vietnameseDates.length === 0 && event.more.includes('|')) {
                                        const parts = event.more.split('|');
                                        if (parts.length >= 2) {
                                            const datePart = parts[1].trim();
                                            
                                            // Tìm trong phần sau dấu |
                                            const dateRange = datePart.split('-');
                                            if (dateRange.length >= 2) {
                                                const startDateStr = dateRange[0].trim();
                                                const endDateStr = dateRange[1].trim();
                                                
                                                // Phân tích ngày bắt đầu
                                                const startMatch = /(\d{1,2})\s+tháng\s+(\d{1,2}),\s+(\d{4})/.exec(startDateStr);
                                                if (startMatch) {
                                                    // startMatch[1] = ngày, startMatch[2] = tháng, startMatch[3] = năm
                                                    event.start_date = new Date(`${startMatch[3]}-${startMatch[2]}-${startMatch[1]}`);
                                                }
                                                
                                                // Phân tích ngày kết thúc
                                                const endMatch = /(\d{1,2})\s+tháng\s+(\d{1,2}),\s+(\d{4})/.exec(endDateStr);
                                                if (endMatch) {
                                                    // endMatch[1] = ngày, endMatch[2] = tháng, endMatch[3] = năm
                                                    event.end_date = new Date(`${endMatch[3]}-${endMatch[2]}-${endMatch[1]}`);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (parseError) {
                            console.error('Lỗi phân tích trường more của giải đấu:', parseError);
                        }
                    }
                    
                    // Lấy tin tức mới nhất (có thể liên quan đến giải đấu)
                    const getRelatedNews = (callback) => {
                        // Tạo các từ khóa từ tên giải đấu để tìm kiếm liên quan
                        const keywords = (event.name || '').split(' ').filter(word => word.length > 3);
                        
                        // Nếu không có từ khóa đủ dài, chỉ lấy tin tức mới nhất
                        if (keywords.length === 0) {
                            connection.query(
                                'SELECT id, title, image_url, description, date FROM news ORDER BY date DESC LIMIT 4',
                                (newsError, newsResults) => {
                                    if (newsError) {
                                        console.error('Lỗi lấy tin tức mới nhất:', newsError);
                                        return callback([], []);
                                    }
                                    return callback(newsResults, []);
                                }
                            );
                            return;
                        }
                        
                        // Tạo điều kiện tìm kiếm với các từ khóa từ tên giải đấu
                        const searchConditions = keywords.map(word => `title LIKE '%${word}%' OR content LIKE '%${word}%'`).join(' OR ');
                        
                        // Truy vấn tin tức liên quan
                        const relatedNewsQuery = `
                            SELECT id, title, image_url, description, date 
                            FROM news 
                            WHERE ${searchConditions}
                            ORDER BY date DESC 
                            LIMIT 3
                        `;
                        
                        connection.query(relatedNewsQuery, (relatedError, relatedResults) => {
                            if (relatedError) {
                                console.error('Lỗi lấy tin tức liên quan:', relatedError);
                                relatedResults = [];
                            }
                            
                            // Lấy thêm tin tức mới nhất nếu tin liên quan ít hơn 3
                            if (relatedResults.length < 3) {
                                const latestNewsQuery = `
                                    SELECT id, title, image_url, description, date 
                                    FROM news 
                                    WHERE id NOT IN (${relatedResults.map(n => n.id).join(',') || 0})
                                    ORDER BY date DESC 
                                    LIMIT ${3 - relatedResults.length}
                                `;
                                
                                connection.query(latestNewsQuery, (latestError, latestResults) => {
                                    if (latestError) {
                                        console.error('Lỗi lấy tin tức mới nhất bổ sung:', latestError);
                                        return callback(relatedResults, []);
                                    }
                                    
                                    // Lấy một tin nổi bật (featured)
                                    const featuredNewsQuery = `
                                        SELECT id, title, image_url, description, date 
                                        FROM news 
                                        WHERE id NOT IN (${[...relatedResults, ...latestResults].map(n => n.id).join(',') || 0})
                                        ORDER BY views DESC, date DESC 
                                        LIMIT 1
                                    `;
                                    
                                    connection.query(featuredNewsQuery, (featuredError, featuredResults) => {
                                        if (featuredError) {
                                            console.error('Lỗi lấy tin nổi bật:', featuredError);
                                            return callback(relatedResults, latestResults);
                                        }
                                        
                                        return callback([...relatedResults, ...latestResults], featuredResults);
                                    });
                                });
                            } else {
                                // Lấy một tin nổi bật (featured)
                                const featuredNewsQuery = `
                                    SELECT id, title, image_url, description, date 
                                    FROM news 
                                    WHERE id NOT IN (${relatedResults.map(n => n.id).join(',') || 0})
                                    ORDER BY views DESC, date DESC 
                                    LIMIT 1
                                `;
                                
                                connection.query(featuredNewsQuery, (featuredError, featuredResults) => {
                                    if (featuredError) {
                                        console.error('Lỗi lấy tin nổi bật:', featuredError);
                                        return callback(relatedResults, []);
                                    }
                                    
                                    return callback(relatedResults, featuredResults);
                                });
                            }
                        });
                    };
                    
                    // Gọi hàm lấy tin tức và render trang
                    getRelatedNews((relatedNews, featuredNews) => {
                        // Render template event.ejs với dữ liệu giải đấu và tin tức
                        return res.render('event', {
                            event: event,
                            categories: allCategories,
                            user: req.session.user || null,
                            relatedNews: relatedNews || [],
                            featuredNews: featuredNews && featuredNews.length > 0 ? featuredNews[0] : null
                        });
                    });
                }
            );
        });
    } catch (err) {
        console.error('Lỗi trong showevent:', err);
        return res.status(500).send('Lỗi server');
    }
};

// Hàm kiểm tra bài viết đã được lưu chưa
exports.checkSavedNews = (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, message: 'Chưa đăng nhập' });
    }
    
    const userId = req.session.user.id;
    const newsId = req.params.newsId;
    
    connection.query(
        'SELECT * FROM saved_news WHERE user_id = ? AND news_id = ?',
        [userId, newsId],
        (error, results) => {
            if (error) {
                console.error('Lỗi kiểm tra bài viết đã lưu:', error);
                return res.json({ success: false, message: 'Lỗi server' });
            }
            
            return res.json({
                success: true,
                isSaved: results.length > 0
            });
        }
    );
};

// Hàm lưu/bỏ lưu bài viết
exports.toggleSaveNews = (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, message: 'Vui lòng đăng nhập để lưu bài viết' });
    }
    
    const userId = req.session.user.id;
    const newsId = req.params.newsId;
    
    // Kiểm tra bài viết đã được lưu chưa
    connection.query(
        'SELECT * FROM saved_news WHERE user_id = ? AND news_id = ?',
        [userId, newsId],
        (checkError, checkResults) => {
            if (checkError) {
                console.error('Lỗi kiểm tra bài viết đã lưu:', checkError);
                return res.json({ success: false, message: 'Lỗi server' });
            }
            
            // Nếu đã lưu rồi thì xóa
            if (checkResults.length > 0) {
                connection.query(
                    'DELETE FROM saved_news WHERE user_id = ? AND news_id = ?',
                    [userId, newsId],
                    (deleteError) => {
                        if (deleteError) {
                            console.error('Lỗi xóa bài viết đã lưu:', deleteError);
                            return res.json({ success: false, message: 'Lỗi server' });
                        }
                        
                        return res.json({
                            success: true,
                            isSaved: false,
                            message: 'Đã bỏ lưu bài viết'
                        });
                    }
                );
            } 
            // Nếu chưa lưu thì thêm mới
            else {
                connection.query(
                    'INSERT INTO saved_news (user_id, news_id, saved_at) VALUES (?, ?, NOW())',
                    [userId, newsId],
                    (insertError) => {
                        if (insertError) {
                            console.error('Lỗi lưu bài viết:', insertError);
                            return res.json({ success: false, message: 'Lỗi server' });
                        }
                        
                        return res.json({
                            success: true,
                            isSaved: true,
                            message: 'Đã lưu bài viết thành công'
                        });
                    }
                );
            }
        }
    );
};

// Hàm lấy danh sách bài viết đã lưu
exports.getSavedNews = (req, res) => {
    console.log("===== getSavedNews function called =====");
    console.log("Session info:", req.session);
    console.log("User info:", req.session ? req.session.user : null);
    
    // Kiểm tra đăng nhập
    if (!req.session || !req.session.user) {
        console.log("User not logged in - rendering saved-news without data");
        return res.render('saved-news', { 
            user: null,
            savedNews: [],
            categories: []
        });
    }
    
    const userId = req.session.user.id;
    console.log("Getting saved news for user ID:", userId);
    
    // Lấy tất cả categories để hiển thị trong header
    connection.query('SELECT * FROM categories ORDER BY name', (categoriesError, allCategories) => {
        if (categoriesError) {
            console.error("Lỗi truy vấn danh mục:", categoriesError);
            return res.render('saved-news', { 
                error: 'Lỗi khi tải danh mục',
                categories: [], 
                user: req.session.user,
                savedNews: []
            });
        }
        
        // Lấy danh sách tin đã lưu
        connection.query(`
            SELECT n.*, c.name as category_name, s.saved_at
            FROM saved_news s
            JOIN news n ON s.news_id = n.id
            LEFT JOIN categories c ON n.category_id = c.id
            WHERE s.user_id = ?
            ORDER BY s.saved_at DESC
        `, [userId], (error, results) => {
            if (error) {
                console.error('Lỗi lấy danh sách bài viết đã lưu:', error);
                return res.render('saved-news', {
                    error: 'Lỗi khi tải bài viết đã lưu',
                    categories: allCategories,
                    savedNews: [],
                    user: req.session.user
                });
            }
            
            console.log(`Found ${results.length} saved news articles`);
            
            // Render trang với dữ liệu đã lấy
            return res.render('saved-news', {
                error: null,
                categories: allCategories,
                savedNews: results,
                user: req.session.user
            });
        });
    });
};

// Hàm xử lý bỏ lưu bài viết
exports.unsaveNews = (req, res) => {
    console.log("===== unsaveNews function called =====");
    
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để thực hiện chức năng này' });
    }
    
    const userId = req.session.user.id;
    const newsId = req.params.newsId;
    
    console.log(`Removing saved news ID ${newsId} for user ID ${userId}`);
    
    connection.query(
        'DELETE FROM saved_news WHERE user_id = ? AND news_id = ?',
        [userId, newsId],
        (error) => {
            if (error) {
                console.error('Lỗi khi bỏ lưu bài viết:', error);
                return res.status(500).json({ success: false, message: 'Lỗi server khi bỏ lưu bài viết' });
            }
            
            return res.status(200).json({ success: true, message: 'Đã bỏ lưu bài viết thành công' });
        }
    );
};

// Hàm xóa tất cả bài viết đã lưu của một user
exports.clearAllSavedNews = (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để thực hiện chức năng này' });
    }
    
    const userId = req.session.user.id;
    
    console.log(`Deleting all saved news for user ID ${userId}`);
    
    connection.query(
        'DELETE FROM saved_news WHERE user_id = ?',
        [userId],
        (error) => {
            if (error) {
                console.error('Lỗi khi xóa tất cả bài viết đã lưu:', error);
                return res.status(500).json({ success: false, message: 'Lỗi server khi xóa bài viết đã lưu' });
            }
            
            return res.status(200).json({ success: true, message: 'Đã xóa tất cả bài viết đã lưu thành công' });
        }
    );
};

// Hàm xử lý gửi góp ý
exports.submitSuggestion = (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để gửi góp ý' });
    }
    
    const userId = req.session.user.id;
    const { news_id, detail } = req.body;
    
    if (!news_id || !detail || detail.trim() === '') {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin góp ý' });
    }
    
    // Lấy thông tin bài viết để làm tiêu đề góp ý
    connection.query('SELECT title FROM news WHERE id = ?', [news_id], (titleError, titleResult) => {
        if (titleError || titleResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
        }
        
        const title = titleResult[0].title;
        const status = 'Chưa xử lý'; // Trạng thái mặc định là chưa xử lý
        
        // Lưu góp ý vào cơ sở dữ liệu
        const insertQuery = `
            INSERT INTO suggestions 
            (title, news_id,user_id, name, status, detail, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        connection.query(insertQuery, [title, news_id, userId, req.session.user.username, status, detail], (error, result) => {
            if (error) {
                console.error('Lỗi khi lưu góp ý:', error);
                return res.status(500).json({ success: false, message: 'Lỗi server khi lưu góp ý' });
            }
            
            return res.status(200).json({ success: true, message: 'Góp ý của bạn đã được ghi nhận!' });
        });
    });
};

// Lấy danh sách góp ý của người dùng
exports.getUserSuggestions = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Kiểm tra người dùng đã đăng nhập và xem đúng góp ý của mình
        if (!req.session.user || req.session.user.id != userId) {
            return res.status(401).json({
                success: false,
                message: 'Bạn không có quyền xem thông tin này'
            });
        }
        
        // Lấy danh sách góp ý của người dùng
        const [suggestions] = await connection.promise().query(
            `SELECT s.*, n.title as articleTitle 
             FROM suggestions s
             LEFT JOIN news n ON s.news_id = n.id
             WHERE s.user_id = ?
             ORDER BY s.created_at DESC`,
            [userId]
        );
        
        return res.json({
            success: true,
            suggestions
        });
    } catch (error) {
        console.error('Error in getUserSuggestions:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách góp ý'
        });
    }
};


exports.searchNews = async (req, res) => {
    try {
        const searchQuery = req.query.q || '';
        
        if (!searchQuery.trim()) {
            return res.redirect('/categorynews');
        }
        
        console.log('Search Query:', searchQuery);
        
        // Lấy tất cả danh mục để hiển thị trong header
        connection.query('SELECT * FROM categories ORDER BY name', (categoriesError, allCategories) => {
            if (categoriesError) {
                console.error("Lỗi truy vấn danh mục:", categoriesError);
                return res.status(500).send('Lỗi server');
            }
            
            // Tìm kiếm bài viết theo tiêu đề, mô tả hoặc nội dung
            const searchSql = `
                SELECT n.*, c.name as category_name 
                FROM news n
                LEFT JOIN categories c ON n.category_id = c.id
                WHERE n.title LIKE ? OR n.description LIKE ? OR n.content LIKE ?
                ORDER BY n.date DESC
            `;
            
            const searchParam = `%${searchQuery}%`;
            
            connection.query(searchSql, [searchParam, searchParam, searchParam], (searchError, searchResults) => {
                if (searchError) {
                    console.error("Lỗi tìm kiếm:", searchError);
                    return res.status(500).send('Lỗi khi tìm kiếm');
                }
                
                console.log(`Tìm thấy ${searchResults.length} kết quả cho "${searchQuery}"`);
                
                return res.render('search-results', {
                    query: searchQuery,
                    articles: searchResults,
                    categories: allCategories,
                    user: req.session.user || null,
                    count: searchResults.length
                });
            });
        });
    } catch (err) {
        console.error('Lỗi trong searchNews:', err);
        return res.status(500).send('Lỗi server');
    }
};

exports.searchEvents = async (req, res) => {
    try {
        const searchQuery = req.query.q || '';

        if (!searchQuery.trim()) {
            return res.redirect('/categorytournament');
        }

        console.log('Search Query:', searchQuery);

        const searchSql = `
            SELECT * 
            FROM tournaments
            WHERE name LIKE ? OR more LIKE ? OR total LIKE ? OR website LIKE ?
            ORDER BY id
        `;

        const searchParam = `%${searchQuery}%`;

        connection.query(searchSql, [searchParam, searchParam, searchParam, searchParam], (searchError, searchResults) => {
            if (searchError) {
                console.error("Lỗi tìm kiếm giải đấu:", searchError);
                return res.status(500).send('Lỗi khi tìm kiếm');
            }

            console.log(`Tìm thấy ${searchResults.length} giải đấu cho "${searchQuery}"`);

            return res.render('', {
                query: searchQuery,
                events: searchResults,
                user: req.session.user || null,
                count: searchResults.length
            });
        });

    } catch (err) {
        console.error('Lỗi trong searchEvents:', err);
        return res.status(500).send('Lỗi server');
    }
};



// API gợi ý tìm kiếm
exports.getSearchSuggestions = async (req, res) => {
    try {
        const searchQuery = req.query.q || '';
        
        if (!searchQuery.trim() || searchQuery.length < 2) {
            return res.json({ suggestions: [] });
        }
        
        console.log('Search Suggestion Query:', searchQuery);
        
        // Tìm kiếm bài viết theo tiêu đề, mô tả
        const searchSql = `
            SELECT id, title, description, image 
            FROM news
            WHERE title LIKE ? OR description LIKE ?
            ORDER BY date DESC
            LIMIT 5
        `;
        
        const searchParam = `%${searchQuery}%`;
        
        connection.query(searchSql, [searchParam, searchParam], (searchError, searchResults) => {
            if (searchError) {
                console.error("Lỗi tìm kiếm gợi ý:", searchError);
                return res.status(500).json({ error: 'Lỗi khi tìm kiếm', suggestions: [] });
            }
            
            console.log(`Tìm thấy ${searchResults.length} gợi ý cho "${searchQuery}"`);
            
            return res.json({
                suggestions: searchResults
            });
        });
    } catch (err) {
        console.error('Lỗi trong getSearchSuggestions:', err);
        return res.status(500).json({ error: 'Lỗi server', suggestions: [] });
    }
};

// API gợi ý tìm kiếm giải đấu
exports.getTournamentSuggestions = async (req, res) => {
    try {
        const searchQuery = req.query.q || '';
        
        if (!searchQuery.trim() || searchQuery.length < 2) {
            return res.json({ suggestions: [] });
        }
        
        console.log('Tournament Search Suggestion Query:', searchQuery);
        
        // Tìm kiếm giải đấu theo tên, địa điểm
        const searchSql = `
            SELECT id, name, more, image
            FROM tournaments
            WHERE name LIKE ? OR location LIKE ?

            ORDER BY id
            LIMIT 5
        `;
        
        const searchParam = `%${searchQuery}%`;
        
        connection.query(searchSql, [searchParam, searchParam], (searchError, searchResults) => {
            if (searchError) {
                console.error("Lỗi tìm kiếm gợi ý giải đấu:", searchError);
                return res.status(500).json({ error: 'Lỗi khi tìm kiếm', suggestions: [] });
            }
            
            console.log(`Tìm thấy ${searchResults.length} gợi ý giải đấu cho "${searchQuery}"`);
            
            return res.json({
                suggestions: searchResults
            });
        });
    } catch (err) {
        console.error('Lỗi trong getTournamentSuggestions:', err);
        return res.status(500).json({ error: 'Lỗi server', suggestions: [] });
    }
};
