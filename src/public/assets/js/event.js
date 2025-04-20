// Lấy dữ liệu giải đấu từ dữ liệu server đã được truyền vào
document.addEventListener("DOMContentLoaded", function() {
  // Các thông tin đã được truyền vào từ controller
  // và đã được render trong file event.ejs
  // Không cần truy cập đến tournamentsData nữa

  // Thêm CSS cho phần nền nếu có
  const eventBackground = document.getElementById("eventBackground");
  if (eventBackground) {
    const backgroundImage = eventBackground.querySelector("img");
    if (backgroundImage) {
      // Thêm CSS để hiển thị ảnh nền
      backgroundImage.style.width = "100%";
      backgroundImage.style.height = "auto";
      backgroundImage.style.objectFit = "cover";
    }
  }

  // Thêm xử lý cho các nút chia sẻ mạng xã hội
  const socialButtons = document.querySelectorAll(".btn-group a");
  if (socialButtons) {
    socialButtons.forEach(button => {
      button.addEventListener("click", function(e) {
        e.preventDefault();
        const url = window.location.href;
        const title = document.querySelector("#eventDetails h2")?.textContent || "Chi tiết giải đấu";
        
        if (this.querySelector("img")?.src.includes("fb")) {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, 
            "facebook-share", "width=580, height=296");
        } else if (this.querySelector("img")?.src.includes("twitter")) {
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, 
            "twitter-share", "width=550, height=235");
        } else if (this.querySelector("img")?.src.includes("instagram")) {
          // Instagram không hỗ trợ chia sẻ trực tiếp qua URL như Facebook và Twitter
          alert("Để chia sẻ trên Instagram, hãy chụp ảnh màn hình và đăng lên Instagram của bạn");
        }
      });
    });
  }

  // Xử lý slider giải đấu ở cuối trang
  loadTournamentSlider();
});

// Hàm tải slider giải đấu ở dưới cùng
function loadTournamentSlider() {
  const sliderContainer = document.getElementById("slider");
  if (!sliderContainer) return;

  // Tải danh sách giải đấu từ API
  fetch('/api/tournament-suggestions?q=')
    .then(response => response.json())
    .then(data => {
      if (data.suggestions && data.suggestions.length > 0) {
        // Hiển thị tối đa 5 giải đấu trong slider
        const maxDisplay = Math.min(5, data.suggestions.length);
        
        for (let i = 0; i < maxDisplay; i++) {
          const tournament = data.suggestions[i];
          const card = document.createElement("div");
          card.className = "tournament-card";
          
          // Format dates
          const startDate = tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('vi-VN') : 'Chưa xác định';
          const endDate = tournament.end_date ? new Date(tournament.end_date).toLocaleDateString('vi-VN') : 'Chưa xác định';
          
          card.innerHTML = `
            <a href="/event?id=${tournament.id}">
              <img src="${tournament.image || '/assets/img/tennis-logo.png'}" alt="${tournament.name}">
              <h3>${tournament.name}</h3>
              <p>${tournament.location} | ${startDate} - ${endDate}</p>
            </a>
          `;
          
          sliderContainer.appendChild(card);
        }
      }
    })
    .catch(error => {
      console.error('Lỗi khi tải giải đấu cho slider:', error);
    });
}

// Xử lý nút Next và Prev cho slider
let currentIndex = 0;

function nextSlide() {
  const slider = document.getElementById("slider");
  const cards = slider.querySelectorAll(".tournament-card");
  if (cards.length <= 3) return; // Không cần trượt nếu ít hơn hoặc bằng 3 thẻ
  
  currentIndex = (currentIndex + 1) % (cards.length - 2);
  slider.style.transform = `translateX(-${currentIndex * 33.33}%)`;
}

function prevSlide() {
  const slider = document.getElementById("slider");
  const cards = slider.querySelectorAll(".tournament-card");
  if (cards.length <= 3) return; // Không cần trượt nếu ít hơn hoặc bằng 3 thẻ
  
  currentIndex = (currentIndex - 1 + cards.length - 2) % (cards.length - 2);
  slider.style.transform = `translateX(-${currentIndex * 33.33}%)`;
}
