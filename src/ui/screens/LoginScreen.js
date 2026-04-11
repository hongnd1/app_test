export function LoginScreen(root, { onLogin }) {
  const container = document.createElement("main");
  container.className = "login-screen";

  container.innerHTML = `
    <section class="login-hero">
      <p class="eyebrow">BLX Student Manager</p>
      <h1>Quan ly hoc sinh, hoc phi va tien do dao tao tren mot man hinh.</h1>
      <p class="hero-copy">
        Giao dien tre trung, loc nhanh hoc vien, theo doi DAT, ly thuyet va sa hinh theo dung mo ta trong tai lieu.
      </p>
      <div class="demo-accounts">
        <div class="demo-accounts__card">
          <strong>Tai khoan dung thu</strong>
          <span>trial / 123456</span>
        </div>
        <div class="demo-accounts__card">
          <strong>Tai khoan vinh vien</strong>
          <span>admin / admin123</span>
        </div>
      </div>
    </section>
    <section class="login-panel">
      <form class="login-form">
        <p class="eyebrow">Dang nhap he thong</p>
        <h2>Chao mung quay lai</h2>
        <label class="field">
          <span>Ten dang nhap</span>
          <input type="text" name="username" placeholder="Nhap ten dang nhap" required />
        </label>
        <label class="field">
          <span>Mat khau</span>
          <input type="password" name="password" placeholder="Nhap mat khau" required />
        </label>
        <p class="form-message" hidden></p>
        <button type="submit" class="primary-button">Dang nhap</button>
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
