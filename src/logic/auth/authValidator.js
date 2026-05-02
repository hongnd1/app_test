export const authValidator = {
  validateCredentials(credentials) {
    const email = credentials.email?.trim() ?? "";
    const password = credentials.password?.trim() ?? "";

    if (!email || !password) {
      return {
        valid: false,
        message: "Vui lòng nhập đầy đủ email và mật khẩu.",
      };
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return {
        valid: false,
        message: "Email không đúng định dạng.",
      };
    }

    return { valid: true };
  },
};
