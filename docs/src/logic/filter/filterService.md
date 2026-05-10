# `src/logic/filter/filterService.js`

## Vai trò

Lọc danh sách học viên theo trạng thái học tập, học phí, DAT, loại bằng và số tiền đã nộp tối thiểu.

## Input

- `students`: danh sách học viên đã normalize.
- `filters`: object gồm `theory`, `saHinh`, `payment`, `dat`, `minPaidAmount`, `licenseFilter`.

## Output

Danh sách học viên thỏa toàn bộ điều kiện lọc.

## Task cần cập nhật

- Khi có `teacherUid`, filter theo phạm vi dữ liệu nên thực hiện ở repository/query trước; filter UI chỉ xử lý điều kiện hiển thị.
- Không dùng filter frontend làm lớp bảo mật.

