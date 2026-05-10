# `src/models/Student.js`

## Vai trò

Chuẩn hóa dữ liệu học viên trước khi lưu hoặc render.

## Output

`createStudentModel(data)` trả về object có các trường chính:

- `id`, `ten`, `sdt`, `tenZalo`, `cccd`, `loaiBang`
- `tongHocPhi`, `daNop`, `conThieu`
- `daHocLyThuyet`, `daHocSaHinh`, `soKmDAT`

## Task cần cập nhật

- Bổ sung `teacherUid` để gắn học viên với giáo viên phụ trách.
- Bổ sung `studentUserUid` nếu học viên có tài khoản đăng nhập.
- Cân nhắc tách thông tin nhạy cảm như CCCD/số điện thoại sang vùng dữ liệu có rules chặt hơn.

