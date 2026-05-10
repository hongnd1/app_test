# `src/logic/progress/progressCalculator.js`

## Vai trò

Tính trạng thái tiến độ học tập cơ bản.

## Quy tắc hiện tại

- Mục tiêu DAT là `810` km.
- `getDatStatus(student)` trả về trạng thái DAT.
- `getStageSummary(student)` mô tả giai đoạn học.
- `getTargetKm()` trả về mục tiêu DAT.

## Task cần cập nhật

- Nếu mục tiêu DAT thay đổi theo loại bằng, chuyển `DAT_TARGET_KM` thành cấu hình theo `loaiBang`.
- Host cần xem tiến độ nhóm theo giáo viên, logic nhóm nên nằm ở `progressService`.

