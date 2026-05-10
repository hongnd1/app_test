# `src/ui/components/StudentDetail.js`

## Vai trò

Render modal/detail của học viên.

## Trách nhiệm chính

- Hiển thị chi tiết học viên.
- Tách phần chi tiết đầy đủ và chi tiết giới hạn theo quyền.
- Render action update DAT, edit, delete nếu được phép.

## Task cần cập nhật

- Đổi naming `Admin/Staff` trong helper sang `Teacher/Student` hoặc permission-based.
- Với role `student`, chỉ hiển thị thông tin cơ bản và thao tác DAT nếu đúng hồ sơ của mình.

