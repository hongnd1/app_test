export function LoginScreen(root, { onLogin, message = "" }) {
  const container = document.createElement("main");
  container.className = "login-screen";

  container.innerHTML = `
    <section class="login-hero">
      <p class="eyebrow">BLX Student Manager</p>
      <h1>Quản lý học sinh, học phí và tiến độ đào tạo trên một màn hình.</h1>
      <p class="hero-copy">
        Chào mừng tới lớp học của Thầy Tuấn Anh, chuyên hỗ trợ thi cấp đổi giấy phép A1 A2 B C1 D E.
      </p>
    </section>
    <section class="login-panel">
      <form class="login-form">
        <p class="eyebrow">Đăng nhập hệ thống</p>
        <h2>Chào mừng quay lại</h2>
        <label class="field">
          <span>Email</span>
          <input type="email" name="email" placeholder="Nhập email đăng nhập" required />
        </label>
        <label class="field">
          <span>Mật khẩu</span>
          <input type="password" name="password" placeholder="Nhập mật khẩu" required />
        </label>
        <p class="form-message" ${message ? "" : "hidden"}>${message}</p>
        <button type="submit" class="primary-button">Đăng nhập</button>
      </form>
    </section>
  `;

  const form = container.querySelector("form");
  const messageElement = container.querySelector(".form-message");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      const result = await onLogin({
        email: form.email.value,
        password: form.password.value,
      });

      if (!result.success) {
        messageElement.hidden = false;
        messageElement.textContent = result.message;
        return;
      }

      messageElement.hidden = true;
    } catch (error) {
      messageElement.hidden = false;
      messageElement.textContent = "Không thể đăng nhập lúc này.";
    } finally {
      submitButton.disabled = false;
    }
  });

  root.appendChild(container);
}
