function showNotification(message, type = "error") {
  let notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerText = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function validateLogin(event) {
  event.preventDefault(); // Ngăn chặn form submit mặc định

  let password = document.getElementById("password").value.trim();
  let passwordError = document.getElementById("passwordError");

  passwordError.innerText = "";

  if (password.length < 6) {
    passwordError.innerText = "Mật khẩu phải có ít nhất 6 ký tự!";
    return;
  }

  let user = users.find(
    (user) => user.username === username && user.password === password
  );
  if (!user) {
    showNotification("Tên đăng nhập hoặc mật khẩu không đúng!", "error");
    return;
  }

  showNotification("Đăng nhập thành công!", "success");
  setTimeout(() => {
    window.location.href = "../index_logined.html";
  }, 1000);
}

function togglePassword() {
  let passwordInput = document.getElementById("password");
  let toggleIcon = document.getElementById("togglePassword");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleIcon.src = "./assets/img/hide-password.svg";
  } else {
    passwordInput.type = "password";
    toggleIcon.src = "./assets/img/show-password.svg";
  }
}
