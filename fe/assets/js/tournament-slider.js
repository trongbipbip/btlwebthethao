// Chuyển object tournamentsData thành một mảng duy nhất
const allTournaments = Object.values(tournamentsData).flat();

const slider = document.getElementById("slider");
let currentIndex = 0;

function renderSlider() {
  slider.innerHTML = "";
  for (let i = currentIndex; i < currentIndex + 5; i++) {
    const tournament = allTournaments[i % allTournaments.length]; // Lặp lại khi hết danh sách
    const card = document.createElement("div");
    card.className = "tournament-card";
    card.innerHTML = `
              <img src="${tournament.image}" alt="${tournament.name}">
              <h3>${tournament.name}</h3>
              <p>${tournament.more}</p>
          `;
    slider.appendChild(card);
  }
}

function nextSlide() {
  currentIndex = (currentIndex + 1) % allTournaments.length;
  renderSlider();
}

function prevSlide() {
  currentIndex =
    (currentIndex - 1 + allTournaments.length) % allTournaments.length;
  renderSlider();
}

// Khởi tạo slider
renderSlider();
