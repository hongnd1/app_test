# `src/logic/student/studentService.js`

## Vai trò

Service nghiệp vụ cho học viên.

## Trách nhiệm chính

- Đọc danh sách học viên.
- Normalize dữ liệu qua `createStudentModel`.
- Enrich học phí qua `paymentService`.
- Tạo id học viên dạng `HS001`.
- Tạo, cập nhật, xóa học viên.
- Validate trước khi lưu.

## Task liên quan phân quyền

- `createStudent` chỉ dành cho `canCreateStudent`.
- `updateStudent` dạng full edit chỉ dành cho `canEditStudent`.
- Cập nhật riêng `soKmDAT` nên có API riêng cho `canEditStudentDat`.
- `deleteStudent` chỉ dành cho `canDeleteStudent`.
- Khi duyệt học sinh, service cần hỗ trợ tạo student từ `studentApplications/{uid}` và gán `teacherUid`, `studentUserUid`.

