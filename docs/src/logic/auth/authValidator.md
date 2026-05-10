# `src/logic/auth/authValidator.js`

## Vai trò

Validate form đăng nhập email/password trước khi gọi Firebase Auth.

## Trách nhiệm chính

- Kiểm tra email không rỗng.
- Kiểm tra định dạng email cơ bản.
- Kiểm tra password không rỗng.

## Task cần lưu ý

- Validator này chỉ xử lý input login, không quyết định quyền vào app.
- Luồng onboarding/application nên có validator riêng cho teacher/student application.

