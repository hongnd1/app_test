# `src/data/mock/schedules.js`

## Vai trò

Dữ liệu lịch DAT mẫu để seed Firestore khi collection `schedules` đang rỗng.

## Dữ liệu chính

Mỗi item mô phỏng lịch DAT: id, học viên, ngày, ca học, ghi chú, trạng thái địa điểm hẹn và thông báo.

## Task cần cập nhật

- Khi giới hạn teacher theo phạm vi, lịch nên có `teacherUid` hoặc suy ra an toàn từ `studentId`.
- Khi student tạo lịch, cần lưu `createdByUid` và kiểm tra lịch thuộc học viên của chính student.

