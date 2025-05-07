let tempAvatar = null; // Biến tạm để lưu ảnh mới nhưng chưa cập nhật vào header

document
  .getElementById("avatarInput")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        document.getElementById("errorAvatar").innerText =
          "Dung lượng ảnh tối đa 5MB";
        return;
      }
      if (!["image/png", "image/jpeg"].includes(file.type)) {
        document.getElementById("errorAvatar").innerText =
          "Chỉ chấp nhận định dạng PNG, JPG";
        return;
      }
      document.getElementById("errorAvatar").innerText = "";
      const reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById("avatarPreview").src = e.target.result;
        tempAvatar = e.target.result; // Lưu vào biến tạm, chưa cập nhật lên header
        // localStorage.setItem("avatar", e.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

// Tải dữ liệu từ localStorage khi mở trang
document.addEventListener("DOMContentLoaded", function () {
  let savedName = localStorage.getItem("fullName");
  let savedAvatar = localStorage.getItem("avatar");

  if (savedName) {
    document.getElementById("fullNameMenu").innerText = savedName;
    document.getElementById("submenuUsername").innerText = savedName;
  }

  if (savedAvatar) {
    document.querySelector(".avatar-container img").src = savedAvatar;
    document.getElementById("submenuAvatar").src = savedAvatar;
  }
});

function saveData() {
  let fullName = document.getElementById("fullName").value.trim();
  let email = document.getElementById("email").value.trim();
  let phone = document.getElementById("phone").value.trim();
  let dob = document.getElementById("dob").value;
  let address = document.getElementById("address").value.trim();
  let gender =
    document.querySelector('input[name="gender"]:checked')?.value || "";
  let today = new Date().toISOString().split("T")[0];

  let isValid = true;

  // Xóa thông báo lỗi cũ
  document.getElementById("errorFullName").innerText = "";
  document.getElementById("errorEmail").innerText = "";
  document.getElementById("errorPhone").innerText = "";
  document.getElementById("errorDob").innerText = "";

  // Kiểm tra dữ liệu đầu vào
  if (!fullName) {
    document.getElementById("errorFullName").innerText =
      "Họ và tên là bắt buộc";
    isValid = false;
  }
  if (!email || !email.endsWith("@gmail.com")) {
    document.getElementById("errorEmail").innerText =
      "Email phải có đuôi @gmail.com";
    isValid = false;
  }
  if (phone && !/^\+84\d{9}$/.test(phone)) {
    document.getElementById("errorPhone").innerText =
      "Số điện thoại phải bắt đầu bằng +84 và có 9 chữ số";
    isValid = false;
  }
  if (dob && dob > today) {
    document.getElementById("errorDob").innerText =
      "Ngày sinh không được vượt quá ngày hôm nay";
    isValid = false;
  }

  if (!isValid) return; // Nếu có lỗi, dừng lại

  // 🔥 Kiểm tra nếu currentUser chưa có, lấy dữ liệu cũ từ localStorage
  let currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (currentUser.avatar.startsWith("/")) {
    currentUser.avatar = "." + currentUser.avatar;
  }

  if (!currentUser) {
    alert("Lỗi: Không tìm thấy tài khoản! Vui lòng đăng nhập lại.");
    return;
  }

  // ✅ Cập nhật dữ liệu người dùng
  currentUser.name = fullName;
  currentUser.email = email;
  currentUser.phone = phone;
  currentUser.dob = dob;
  currentUser.address = address;
  currentUser.gender = gender;

  if (tempAvatar) {
    currentUser.avatar = tempAvatar; // Cập nhật avatar nếu có ảnh mới
  }

  // 🔥 Ghi lại vào localStorage với JSON chuẩn
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  // ✅ Cập nhật giao diện ngay
  document.getElementById("fullNameMenu").innerText = fullName;
  document.getElementById("submenuUsername").innerText = fullName;

  if (tempAvatar) {
    document.querySelector(".avatar-container img").src = tempAvatar;
    document.getElementById("submenuAvatar").src = tempAvatar;
    tempAvatar = null; // Reset biến tạm
  }

  alert("Thông tin đã được lưu!");
}

document.querySelectorAll("input, textarea").forEach((input) => {
  input.addEventListener("input", () => {
    sessionStorage.setItem(input.id, input.value);
  });
});

window.onload = function () {
  // Xóa sessionStorage (chỉ xóa input chưa lưu)
  sessionStorage.clear();

  // 🔥 Lấy dữ liệu từ currentUser trong localStorage
  let currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (currentUser.avatar.startsWith("/")) {
    currentUser.avatar = "." + currentUser.avatar;
  }

  if (!currentUser) {
    alert("Lỗi: Không tìm thấy tài khoản! Vui lòng đăng nhập lại.");
    return;
  }

  // Cập nhật thông tin người dùng vào input
  document.getElementById("fullName").value = currentUser.name || "";
  document.getElementById("email").value = currentUser.email || "";
  document.getElementById("phone").value = currentUser.phone || "";
  document.getElementById("dob").value = currentUser.dob || "";
  document.getElementById("address").value = currentUser.address || "";

  if (currentUser.gender) {
    document.querySelector(
      `input[name="gender"][value="${currentUser.gender}"]`
    ).checked = true;
  }

  // 🔥 Cập nhật avatar nếu có
  if (currentUser.avatar) {
    document.getElementById("avatarPreview").src = currentUser.avatar;
    document.getElementById("submenuAvatar").src = currentUser.avatar;
    document.querySelector(".avatar-container img").src = currentUser.avatar;
  }

  // Cập nhật tên trên menu
  document.getElementById("fullNameMenu").innerText = currentUser.name;
  document.getElementById("submenuUsername").innerText = currentUser.name;
};

///////////////////////////////////////////////////////////////
const savedNums = JSON.parse(localStorage.getItem("savedNews")) || [];
document.getElementById("savedCount").innerText = savedNums.length;
