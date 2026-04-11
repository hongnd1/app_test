export function LoginScreen(root, { onLogin }) {
  const container = document.createElement("main");
  container.className = "login-screen";

  container.innerHTML = `
    <section class="login-hero">
      <p class="eyebrow">BLX Student Manager</p>
      <h1>Quản lý học sinh, học phí và tiến độ đào tạo trên một màn hình.</h1>
      <p class="hero-copy">
        Giao diện trẻ trung, lọc nhanh học viên, theo dõi DAT, lý thuyết và sa hình theo đúng mô tả trong tài liệu.
      </p>
      <div class="demo-accounts">
        <div class="demo-accounts__card">
          <strong>Tài khoản dùng thử</strong>
          <span>trial / 123456</span>
        </div>
        <div class="demo-accounts__card">
          <strong>Tài khoản vĩnh viễn</strong>
          <span>admin / admin123</span>
        </div>
      </div>
    </section>
    <section class="login-panel">
      <form class="login-form">
        <p class="eyebrow">Đăng nhập hệ thống</p>
        <h2>Chào mừng quay lại</h2>
        <label class="field">
          <span>Tên đăng nhập</span>
          <input type="text" name="username" placeholder="Nhập tên đăng nhập" required />
        </label>
        <label class="field">
          <span>Mật khẩu</span>
          <input type="password" name="password" placeholder="Nhập mật khẩu" required />
        </label>
        <p class="form-message" hidden></p>
        <button type="submit" class="primary-button">Đăng nhập</button>
      </form>
    </section>
  `;

  const form = container.querySelector("form");
  const messageElement = container.querySelector(".form-message");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const result = onLogin({
      username: form.username.value,
      password: form.password.value,
    });

    if (!result.success) {
      messageElement.hidden = false;
      messageElement.textContent = result.message;
      return;
    }

    messageElement.hidden = true;
  });

  root.appendChild(container);
}
