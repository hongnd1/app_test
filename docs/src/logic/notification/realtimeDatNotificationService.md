# `src/logic/notification/realtimeDatNotificationService.js`

## Vai trò

Service notification realtime trong trình duyệt cho lịch DAT.

## Trách nhiệm chính

- Kiểm tra Browser Notification API có được hỗ trợ không.
- Đọc trạng thái permission notification.
- Nhận diện lịch DAT pending.
- Build notification cho lịch DAT cần xử lý.
- Hiển thị browser notification khi được cấp quyền.
- Theo dõi danh sách schedule để phát hiện thông báo cần bắn.

## Task cần cập nhật

- Chỉ chạy listener khi session có quyền dùng notification.
- Với teacher, chỉ theo dõi lịch thuộc `teacherUid` của mình.
- Với student, chỉ theo dõi lịch thuộc hồ sơ của mình.
- Với viewer/deactive, không chạy notification nghiệp vụ.

