# `src/logic/notification/notificationModeService.js`

## Vai trò

Service đọc/ghi notification mode và kiểm tra session có được dùng/quản lý notification hay không.

## Trách nhiệm hiện tại

- Kiểm tra mode `off`, `realtime`, `fcm`.
- Đổi mode qua `notificationConfig`.
- Tạo label mode.
- `canUseNotification(session)` hiện dựa vào danh sách role cũ.
- `canManageNotificationMode(session)` hiện kiểm tra role `host`.

## Task cần cập nhật

- Thay `NOTIFICATION_ROLES` role cũ bằng permission `canEnablePushNotifications`.
- Quản lý mode bằng permission `canSetNotificationMode`.
- Role mới đề xuất: `teacher` và `student` có thể bật notification; `host` quản lý mode; `viewer` không dùng notification nghiệp vụ.

