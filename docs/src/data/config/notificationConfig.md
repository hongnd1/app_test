# `src/data/config/notificationConfig.js`

## Vai trò

Quản lý cấu hình notification ở client, gồm mode `off`, `realtime`, `fcm` và lưu override vào `localStorage`.

## Trách nhiệm chính

- Định nghĩa `NOTIFICATION_MODES`.
- Validate mode bằng `isValidNotificationMode`.
- Đọc mode đã lưu từ `localStorage`.
- Export `notificationConfig`, `getNotificationMode`, `setNotificationMode`, `clearNotificationModeOverride`.

## Task liên quan phân quyền

- Chỉ role có `canSetNotificationMode` mới được đổi mode.
- Theo đề xuất, quyền này thuộc `host`.
- Service/UI không nên kiểm tra role trực tiếp, mà dùng permission từ session.

