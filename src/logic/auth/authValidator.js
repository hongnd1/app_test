export const authValidator = {
  validateCredentials(credentials) {
    const username = credentials.username?.trim() ?? "";
    const password = credentials.password?.trim() ?? "";

    if (!username || !password) {
      return {
        valid: false,
        message: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.",
      };
    }

    return { valid: true };
  },
};
