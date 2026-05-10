# `src/logic/schedule/scheduleSlots.js`

## Vai trò

Định nghĩa các ca học DAT cố định.

## Slot hiện tại

- `morning`: 06:00 - 11:30
- `afternoon`: 13:00 - 17:00
- `evening`: 18:00 - 21:00

## API

- `getScheduleSlot(slotKey)`
- `getScheduleSlotList()`
- `findScheduleSlotByTimeRange(startTime, endTime)`

## Task cần lưu ý

- Nếu lịch có nhiều giáo viên hoặc xe, validator cần kiểm tra trùng theo đúng tài nguyên, không chỉ trùng giờ toàn cục.

