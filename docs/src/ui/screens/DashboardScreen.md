# `src/ui/screens/DashboardScreen.js`

## Vai trò

Render dashboard chính bằng DOM thuần.

## Khu vực chính

- Tiến độ học viên.
- Lịch DAT và calendar.
- Danh sách học viên, filter, detail, form.
- Cài đặt notification.
- Notification center, toast, popup.

## Task liên quan phân quyền

- Các nút thao tác dựa vào `permissions` được truyền từ `main.js`.
- Khi chuyển sang role mới, label và visibility cần bám theo `canCreateStudent`, `canEditStudent`, `canDeleteStudent`, `canCreateSchedule`, `canSetNotificationMode`.
- Host cần màn tiến độ theo giáo viên.
- Student/viewer cần ẩn thông tin nhạy cảm nếu không có `canViewSensitiveStudentInfo`.

