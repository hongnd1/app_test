# `src/models/Schedule.js`

## Vai trò

Chuẩn hóa dữ liệu lịch DAT và suy luận slot học từ khung giờ khi cần.

## Output

`createScheduleModel(data)` trả về lịch đã chuẩn hóa:

- Thông tin học viên: `studentId`, `studentName`, liên hệ, loại bằng.
- Thời gian: `date`, `slotKey`, `slotLabel`, `startTime`, `endTime`, `time`.
- Địa điểm hẹn: `meetingLocation`, `meetingLocationStatus`, `teacherConfirmed`.
- Notification metadata: `notificationStatus`, `notifiedAt`, timestamps.

## Task cần cập nhật

- Thêm `teacherUid` để rules kiểm soát lịch theo giáo viên.
- Thêm `createdByUid` khi student hoặc teacher tạo lịch.
- Validate quan hệ `studentId`/`teacherUid` ở service và Firestore Rules.

