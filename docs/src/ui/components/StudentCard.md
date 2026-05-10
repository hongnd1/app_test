# `src/ui/components/StudentCard.js`

## Vai trò

Render card tóm tắt học viên trong danh sách.

## Trách nhiệm chính

- Hiển thị thông tin cơ bản, trạng thái học phí/DAT.
- Hiển thị action detail/edit/delete theo quyền.
- Format tiền tệ.

## Task cần cập nhật

- Ẩn số điện thoại, Zalo, CCCD, học phí nếu thiếu `canViewSensitiveStudentInfo`.
- Edit/delete phải dựa trên permission, không dựa trực tiếp vào role.

