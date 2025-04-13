function toggleMenu() {
  document.getElementById("dropdownMenu").classList.toggle("active");
}
document.addEventListener("DOMContentLoaded", function () {
  const avatar = document.querySelector(".avatar-container");
  if (avatar) {
    document.addEventListener("click", function (event) {
      const menu = document.getElementById("dropdownMenu");
      if (menu && !avatar.contains(event.target)) {
        menu.classList.remove("active");
      }
    });
  }
});
// document.getElementById("header").innerHTML = `
// <div class="avatar-container" onclick="toggleMenu()">
// <img src="./assets/img/avatar.jpg" alt="Avatar" class="avatar" />
// <div class="dropdown-menu" id="dropdownMenu">
//   <div class="menu-title">
//     <strong id="fullNameMenu">Minh Quân Đỗ</strong>
//   </div>
//   <div class="menu-item">
//     <a href="./account-detail.html">👤 Thông tin tài khoản</a>
//   </div>
//   <div class="menu-item">
//     <a href="/saved-news.html">🔖 Tin bài đã lưu</a>
//   </div>
//   <div class="menu-item">
//     <a id="logoutBtn">↩️ Thoát tài khoản</a>
//   </div>
// </div>
// </div>
// `;
setTimeout(() => {
  let fullNameElement = document.getElementById("fullNameMenu");
  if (fullNameElement) {
    console.log("Tìm thấy phần tử:", fullNameElement.innerText);
  } else {
    console.log("Không tìm thấy phần tử #fullNameMenu");
  }
}, 100);

document.addEventListener("DOMContentLoaded", function () {
  let savedName = localStorage.getItem("fullName");
  let savedAvatar = localStorage.getItem("avatar");

  if (savedName) {
    let menuFullName = document.getElementById("fullNameMenu");
    let submenuFullName = document.getElementById("submenuUsername");

    if (menuFullName) menuFullName.innerText = savedName;
    if (submenuFullName) submenuFullName.innerText = savedName;
  }

  if (savedAvatar) {
    let avatarHeader = document.querySelector(".avatar-container img");
    let avatarSubmenu = document.getElementById("submenuAvatar");

    if (avatarHeader) avatarHeader.src = savedAvatar;
    if (avatarSubmenu) avatarSubmenu.src = savedAvatar;
  }
});

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "./index.html";
}
document.getElementById("logoutBtn")?.addEventListener("click", logout);
