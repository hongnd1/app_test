import { accountService } from "./accountService.js";
import { authValidator } from "./authValidator.js";

export const loginService = {
  login(credentials) {
    const validation = authValidator.validateCredentials(credentials);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const account = accountService.findAccount(credentials.username.trim());
    if (!account || account.password !== credentials.password.trim()) {
      return { success: false, message: "Thông tin đăng nhập không chính xác." };
    }

    const activeAccount = accountService.activateTrialIfNeeded(account);
    const session = accountService.createSession(activeAccount);

    if (session.expired) {
      return {
        success: false,
        message: "Tài khoản dùng thử đã hết hạn. Vui lòng nâng cấp tài khoản.",
      };
    }

    return { success: true, session };
  },

  logout() {
    accountService.clearSession();
  },
};
