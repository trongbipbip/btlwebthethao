// Lấy ID từ URL
function getEventIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id"); // Lấy giá trị của "id"
}

// Tìm sự kiện theo ID
function findEventById(eventId) {
  for (const year in tournamentsData) {
    const event = tournamentsData[year].find((e) => e.id === eventId);
    if (event) return event;
  }
  return null;
}

// Hiển thị sự kiện
function displayEvent() {
  const eventId = parseInt(getEventIdFromURL(), 10); // Chuyển ID thành số nguyên
  const event = findEventById(eventId);

  if (!event) {
    document.getElementById("eventDetails").innerHTML =
      "<p>Không tìm thấy sự kiện!</p>";
    return;
  }

  document.getElementById("eventDetails").innerHTML = `
  <div class="container">
  <div class="item">
      <span>Địa điểm:</span>
      <span>${event.location}</span>
  </div>
  <div class="item">
      <span>Website <br/>chính thức</span>
      <a href="${event.website}" class="link">${event.website}</a>
  </div>
  <div class="item">
      <span>Mặt sân:</span>
      <span>${event.surface}</span>
  </div>
  <div class="item">
      <span>Theo dõi giải đấu</span>
      <div class="btn-group">
          <a href="#" class="link"><img src="./assets/img/tournament/fb.svg" alt=""></a>
          <a href="#" class="link"><img src="./assets/img/tournament/instagram.svg" alt=""></a>
          <a href="#" class="link"><img src="./assets/img/tournament/twitter.svg" alt=""></a>
      </div>
  </div>
  <div class="item">
      <span>Giải thưởng</span>
      <span>${event.prize}</span>
  </div>
  <div class="item">
      <span>Tổng cam kết tài chính</span>
      <span>${event.total}</span>
  </div>
</div>
  `;

  document.getElementById("eventContent").innerHTML = `
<h2>${event.name}</h2>
<p>${event.content}</p>
 `;

  document.getElementById("eventBackground").innerHTML = `
    <img src="${
      event.background || "./assets/img/tournament/tournament1.png"
    }" alt="Event Background">
  `;
}

// Gọi hàm hiển thị khi trang tải
document.addEventListener("DOMContentLoaded", displayEvent);
