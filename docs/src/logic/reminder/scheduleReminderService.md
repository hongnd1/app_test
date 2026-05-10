# `src/logic/reminder/scheduleReminderService.js`

## Vai trò

Nhắc giáo viên xử lý lịch DAT cần địa điểm hẹn vào các khung giờ cố định.

## Trách nhiệm chính

- Khung nhắc hiện tại: 21h và 22h.
- Lưu dấu đã nhắc vào `localStorage` để tránh nhắc lặp.
- Tìm lịch pending theo ngày.
- Tạo nội dung reminder.
- Tính thời điểm trigger tiếp theo.
- Khởi động scheduler và gọi callback khi đến giờ.

## Task liên quan phân quyền

- Reminder chỉ nên chạy khi session có quyền nhận notification nghiệp vụ.
- Teacher chỉ nhận reminder cho lịch thuộc phạm vi mình quản lý.
- Student có thể nhận reminder khác nếu app cần, nhưng không nên nhận reminder cập nhật địa điểm hẹn của giáo viên.

