# `src/logic/schedule/scheduleValidator.js`

## Vai trò

Validate nghiệp vụ khi tạo lịch DAT.

## Quy tắc hiện tại

- Phải có học viên.
- Học viên phải hoàn thành lý thuyết.
- Phải chọn ngày.
- Phải chọn ca hợp lệ.
- Giờ bắt đầu/kết thúc phải đúng slot.
- Không được trùng giờ với lịch khác trong cùng ngày.

## Task cần cập nhật

- Kiểm tra quyền tạo lịch theo `canCreateSchedule` ở tầng gọi.
- Với role `student`, chỉ cho tạo lịch cho hồ sơ gắn với `studentUserUid`.
- Với role `teacher`, chỉ cho tạo lịch cho học viên có `teacherUid` của mình.

