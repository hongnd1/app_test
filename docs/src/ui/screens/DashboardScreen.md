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

## Cap nhat UI moi

- Notification center co nut `Xoa` cho tung item.
- Tab cai dat co form `Gop y va phan hoi` cho teacher/student.
- Host thay panel `Van de app` trong cai dat va co nut danh dau da xu ly.
- Tab `Thong ke` chi render khi co `canViewStatistics`; host co select chon giao vien.
- Tab cai dat hien thi theo accordion: ben ngoai chi co tieu de, bam vao moi mo noi dung thao tac.
- Accordion cai dat da doi sang `details/summary` de trang thai dong chi render summary tieu de.
- Host co nut `Xoa` voi van de app da xu ly.
