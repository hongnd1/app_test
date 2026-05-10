# `src/logic/progress/progressService.js`

## Vai trò

Tạo dữ liệu thống kê tiến độ cho dashboard.

## API

- `getDatStatus(student)`
- `getStageSummary(student)`
- `getDashboardStatistics(students)`
- `getProgressOverview(students)`

## Output chính

Thống kê gồm số học viên hoàn thành lý thuyết, còn nợ học phí, hoàn thành sa hình, đạt DAT và tổng doanh thu.

## Task cần cập nhật

- Thêm hàm nhóm tiến độ theo `teacherUid` cho màn host.
- Khi role không có quyền xem thông tin nhạy cảm, không trả hoặc không render doanh thu/học phí.

