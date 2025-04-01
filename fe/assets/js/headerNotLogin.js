// // Đợi DOM load xong trước khi thực thi
// window.onload = function () {
//   document.getElementById("header").innerHTML = `
//     <div class="category-item">
//       <img src="./assets/img/account.svg" alt="Account" />
//       <h2><a href="#" onclick="showPopup()">ĐĂNG NHẬP</a></h2>
//     </div>`;
// };

function showPopup() {
  document.getElementById("login-popup").innerHTML = `
          <div class="login-overlay" id="overlay" onclick="closePopup(event)">
              <div class="login-popup" onclick="event.stopPropagation()">
                  <p class="login-title"><strong>Bạn đăng nhập với tư cách...</strong></p>
                  <div class="login-options">
                  <button class="login-option" onclick="selectRole('Người đọc')">Người đọc</button>
                      <button class="login-option" onclick="selectRole('Admin')">Admin</button>
                  </div>
              </div>
          </div>`;
  document.getElementById("overlay").style.display = "flex";
}

function selectRole(role) {
  let urls = {
    ["Admin"]: "./login/login_admin.html",
    "Người đọc": "./login/login_nor.html",
  };
  window.location.href = urls[role] || "#";
}

function closePopup(event) {
  if (!event || event.target.id === "overlay") {
    document.getElementById("login-popup").innerHTML = "";
  }
}
