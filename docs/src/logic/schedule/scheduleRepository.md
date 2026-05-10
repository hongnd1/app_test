# `src/logic/schedule/scheduleRepository.js`

## Vai trò

Repository cho collection `schedules`, dùng `createCollectionStore`.

## API

- `getAll()`
- `save(schedule)`
- `remove(scheduleId)`

## Task cần cập nhật

- Không đọc toàn bộ lịch nếu user chỉ được xem phạm vi của mình.
- Cần query theo `teacherUid` hoặc `studentUserUid` khi áp dụng phân quyền backend.
- Firestore Rules phải chặn ghi trái phạm vi, kể cả khi frontend gọi nhầm.

