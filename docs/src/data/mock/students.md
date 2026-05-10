# `src/data/mock/students.js`

## Vai trò

Dữ liệu học viên mẫu để seed Firestore khi collection `students` đang rỗng.

## Dữ liệu chính

Mỗi item mô phỏng model học viên: mã học viên, tên, số điện thoại, Zalo, CCCD, loại bằng, học phí, trạng thái lý thuyết/sa hình và số km DAT.

## Task cần cập nhật

- Khi thêm phân quyền theo giáo viên, mock student nên có `teacherUid`.
- Khi học sinh tự đăng nhập, student tương ứng nên có `studentUserUid`.
- Tránh đưa dữ liệu cá nhân thật vào mock.

