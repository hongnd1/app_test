# `src/logic/student/studentValidator.js`

## Vai trò

Validate hồ sơ học viên.

## Quy tắc hiện tại

- Tên không rỗng.
- Số điện thoại gồm 9 đến 11 chữ số.
- Tên Zalo không rỗng.
- CCCD gồm đúng 12 chữ số.
- Có loại bằng.
- Học phí, đã nộp và km DAT không âm.
- Đã nộp không lớn hơn tổng học phí.

## Task cần cập nhật

- Với student tự cập nhật DAT, chỉ validate `soKmDAT` thay vì bắt toàn bộ hồ sơ.
- Với onboarding học sinh, nên có validator riêng để giảm trường nhạy cảm bắt buộc.

