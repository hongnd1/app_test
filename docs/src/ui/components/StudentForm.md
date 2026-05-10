# `src/ui/components/StudentForm.js`

## Vai trò

Render form tạo/sửa học viên.

## Trách nhiệm chính

- Render field đầy đủ cho quyền quản lý.
- Render field giới hạn cho cập nhật DAT.
- Submit dữ liệu qua handler.

## Task cần cập nhật

- Đổi helper `buildAdminFields`/`buildStaffFields` sang tên theo permission.
- Tách form full profile và form cập nhật DAT để giảm rủi ro role student gửi field ngoài quyền.
- Ẩn field nhạy cảm nếu không có quyền.

