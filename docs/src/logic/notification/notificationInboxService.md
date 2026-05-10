# `src/logic/notification/notificationInboxService.js`

## Vai trò

Quản lý inbox thông báo cục bộ theo từng user bằng `localStorage`.

## Trách nhiệm chính

- Đọc/ghi inbox theo key `blx_notification_inbox:{uid}`.
- Normalize notification để có `id`, `key`, `title`, `body`, `channel`, `createdAt`, `readAt`.
- Chống trùng thông báo bằng `key`.
- Đồng bộ các lịch DAT còn thiếu địa điểm hẹn thành notification `pending-dat`.
- Đánh dấu đã đọc từng notification hoặc tất cả.
- Xóa inbox của user.

## Task liên quan phân quyền

- Chỉ user có `canEnablePushNotifications` hoặc quyền notification phù hợp mới nên sync inbox nghiệp vụ.
- Với role `viewer`, không nên tạo inbox nhắc việc nghiệp vụ.
- Khi student có notification riêng, cần lọc theo `studentUserUid`.

## Cap nhat xoa thong bao

- API `removeNotification(uid, notificationId)` xoa mot item khoi inbox localStorage va tra ve inbox da sort lai.
