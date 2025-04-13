// Hiển Thị Nội Dung Chi Tiết

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const newsId = getQueryParam("id");

// Tìm bài viết từ danh sách `newsData`
const newsItem = newsData.find((news) => news.id == newsId);

if (newsItem) {
  document.getElementById("news-title").textContent = newsItem.title;
  document.getElementById("news-date").textContent = newsItem.date;
  document.getElementById("news-image").src = newsItem.image;
  document.getElementById("news-content").innerHTML = newsItem.content.replace(
    /\n/g,
    "<br>"
  );
} else {
  document.getElementById("news-content").innerHTML =
    "<p>Bài viết không tồn tại!</p>";
}

// Cập nhật detail.html với nút "Quay lại"
function goBack() {
  window.history.back();
}

// Nếu không có headerLogined, vô hiệu hóa nút lưu
document.addEventListener("DOMContentLoaded", function () {
  const saveButton = document.querySelector(".save");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    const saveButton = document.querySelector(".save");
    if (saveButton) {
      saveButton.addEventListener("click", function () {
        alert("Bạn cần đăng nhập để lưu bài viết");
      });
    }
    localStorage.clear();
  }

  // Lấy dữ liệu từ localStorage
  let savedNews = JSON.parse(localStorage.getItem("savedNews")) || [];
  const newsId = getQueryParam("id");

  function updateSaveButton(isSaved) {
    if (isSaved) {
      saveButton.textContent = "Đã lưu";
      saveButton.style.color = "#60b004"; // Màu xanh
      saveButton.style.border = "2px solid #60b004";
    } else {
      saveButton.textContent = "Lưu bài viết";
      saveButton.style.color = ""; // Trở lại mặc định
      saveButton.style.border = "";
    }
  }

  // Kiểm tra xem bài viết đã được lưu chưa
  let isSaved = savedNews.some((news) => news.id == newsId);
  updateSaveButton(isSaved);

  // Sự kiện khi bấm nút lưu / hủy lưu
  saveButton.addEventListener("click", function () {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) {
      alert("Bạn cần đăng nhập để lưu bài viết");
      return;
    }
    if (isSaved) {
      savedNews = savedNews.filter((news) => news.id != newsId);
    } else {
      const newsItem = newsData.find((news) => news.id == newsId);
      if (newsItem) {
        savedNews.push(newsItem);
      }
    }

    localStorage.setItem("savedNews", JSON.stringify(savedNews));
    isSaved = !isSaved; // Đảo trạng thái
    updateSaveButton(isSaved); // Cập nhật giao diện
  });
});

// Hiển thị overlay khi bấm "Góp ý"
const overlay = document.querySelector(".overlay");
document.querySelector(".suggest").addEventListener("click", function () {
  overlay.style.display = "flex";
});

overlay.addEventListener("click", function (event) {
  if (event.target === overlay) {
    overlay.style.display = "none";
  }
});

document.querySelector(".cancel").addEventListener("click", function () {
  overlay.style.display = "none";
});

document.querySelector(".submit").addEventListener("click", function () {
  alert("Cảm ơn bạn đã góp ý");
  overlay.style.display = "none";
});
