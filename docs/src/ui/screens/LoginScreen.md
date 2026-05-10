# `src/ui/screens/LoginScreen.js`

## Vai trò

Render màn hình đăng nhập bằng email/password và Google.

## Trách nhiệm chính

- Nhận `onLogin`, `onLoginWithGoogle`, `message`.
- Lấy email/password từ form.
- Hiển thị lỗi hoặc thông báo đăng nhập.

## Task cần cập nhật

- Sau khi login Firebase thành công, màn hình tiếp theo không luôn là dashboard.
- App cần route sang onboarding, pending approval hoặc rejected theo auth state.
- Login screen không quyết định quyền, chỉ nhận message từ auth flow.

