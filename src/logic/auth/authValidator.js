export const authValidator = {
  validateCredentials(credentials) {
    const username = credentials.username?.trim() ?? "";
    const password = credentials.password?.trim() ?? "";

    if (!username || !password) {
      return {
        valid: false,
        message: "Vui long nhap day du ten dang nhap va mat khau.",
      };
    }

    return { valid: true };
  },
};
