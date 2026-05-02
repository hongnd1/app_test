export function LoginScreen(root, { onLogin, onLoginWithGoogle, message = "" }) {
  const container = document.createElement("main");
  container.className = "login-screen";

  container.innerHTML = `
    <section class="login-hero">
      <p class="eyebrow">BLX Student Manager</p>
      <h1>Quản lý học viên, học phí và tiến độ đào tạo trên một màn hình.</h1>
      <p class="hero-copy">
        Chào mừng tới lớp học của Thầy Tuấn Anh, chuyên hỗ trợ thi cấp đổi giấy phép A1, A2, B, C1, D, E.
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
        <div class="login-actions">
          <button type="submit" class="primary-button">Đăng nhập bằng email</button>
          <button type="button" class="secondary-button" data-action="google-login">Đăng nhập với Google</button>
        </div>
      </form>
    </section>
  `;

  const form = container.querySelector("form");
  const messageElement = container.querySelector(".form-message");
  const submitButton = form.querySelector('button[type="submit"]');
  const googleButton = container.querySelector('[data-action="google-login"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    googleButton.disabled = true;
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
    } catch {
      messageElement.hidden = false;
      messageElement.textContent = "Không thể đăng nhập lúc này.";
    } finally {
      submitButton.disabled = false;
      googleButton.disabled = false;
    }
  });

  googleButton.addEventListener("click", async () => {
    submitButton.disabled = true;
    googleButton.disabled = true;
    try {
      const result = await onLoginWithGoogle();
      if (!result.success) {
        messageElement.hidden = false;
        messageElement.textContent = result.message;
        return;
      }

      messageElement.hidden = true;
    } catch {
      messageElement.hidden = false;
      messageElement.textContent = "Không thể đăng nhập với Google lúc này.";
    } finally {
      submitButton.disabled = false;
      googleButton.disabled = false;
    }
  });

  root.appendChild(container);
}
