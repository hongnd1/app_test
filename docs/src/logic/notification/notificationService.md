# `src/logic/notification/notificationService.js`

## Vai trò

Service FCM/push notification. File này xử lý token, foreground message và fallback notification trong app/browser.

## Trách nhiệm chính

- Quản lý listener in-app.
- Resolve Firebase Messaging khi môi trường hỗ trợ.
- Lấy VAPID key từ config.
- Đăng ký token notification vào Firestore collection `notificationTokens`.
- Tìm token hiện tại của session.
- Hiển thị browser notification nếu được cấp quyền.
- Chuẩn hóa payload FCM thành notification thân thiện với UI.

## Task liên quan bảo mật

- Token notification phải gắn với `uid`, role/effectiveRole hoặc metadata cần thiết.
- Khi tài khoản deactive, nên xóa hoặc vô hiệu token nghiệp vụ.
- Firestore Rules cho `notificationTokens` phải chỉ cho user ghi token của chính mình và cho backend/host đọc theo nhu cầu gửi.

## Task liên quan role mới

- Chỉ cho đăng ký token nếu session có `canEnablePushNotifications`.
- `host` chỉ nên quản lý mode, không mặc định nhận notification nghiệp vụ học viên nếu policy không yêu cầu.

