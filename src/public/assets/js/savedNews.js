document.addEventListener("DOMContentLoaded", function () {
  let savedNews = JSON.parse(localStorage.getItem("savedNews")) || []; // Lấy danh sách tin đã lưu từ localStorage
  const newsContainer = document.getElementById("news-list");

  if (savedNews.length > 0) {
    newsContainer.style.display = "none"; // Ẩn danh sách tin tức nếu có tin đã lưu
  }

  renderNews(); // Gọi lại hàm render danh sách tin tức
});

document.addEventListener("DOMContentLoaded", function () {
  // Lấy container hiển thị tin đã lưu
  const container = document.getElementById("savedNewsContainer");
  const clearButton = document.getElementById("clearSavedNews");
  let savedNews = JSON.parse(localStorage.getItem("savedNews")) || [];

  if (savedNews.length === 0) {
    container.innerHTML = `
        <div class="empty-state">
            <img src="./assets/img/loading-glass.svg" alt="">
            <p>Rất tiếc, chưa có tin bài nào. <a href="#">Khám phá ngay!</a></p>
        </div>
    `;
    clearButton.style.display = "none";
  } else {
    clearButton.style.display = "block";
    savedNews.forEach((news) => {
      const newsItem = document.createElement("div");
      newsItem.classList.add("news-item");
      newsItem.innerHTML = `
            <a href="#" onclick="viewDetail(${news.id})">
                <img src="${news.image}" alt="News Image">
            </a>
            <div class="news-content">
                <div class="news-detail">
                    <div class="news-title"><a href="#" onclick="viewDetail(${news.id})">${news.title}</a></div>
                    <div class="news-description">${news.description}</div>
                </div>
                <button class="remove-btn" onclick="removeSavedNews(${news.id})">Xóa</button>
            </div>
        `;
      container.appendChild(newsItem);
    });
  }

  // Xóa tất cả tin đã lưu
  clearButton.addEventListener("click", function () {
    localStorage.removeItem("savedNews"); // Xóa khỏi localStorage
    location.reload(); // Reload lại trang để cập nhật
  });
});

// Xóa bài viết đã lưu
function removeSavedNews(id) {
  let savedNews = JSON.parse(localStorage.getItem("savedNews")) || [];
  savedNews = savedNews.filter((news) => news.id !== id);
  localStorage.setItem("savedNews", JSON.stringify(savedNews));
  location.reload();
}

///////////////////////////////////////////////////////////////
const savedNums = JSON.parse(localStorage.getItem("savedNews")) || [];
document.getElementById("savedCount").innerText = savedNums.length;
