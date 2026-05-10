# `src/logic/schedule/scheduleService.js`

## Vai trò

Service nghiệp vụ cho lịch DAT.

## Trách nhiệm chính

- Normalize và sort lịch.
- Tạo id lịch dạng `DAT001`.
- Tạo lịch từ payload và student.
- Validate lịch trước khi lưu.
- Cập nhật địa điểm hẹn.
- Xóa lịch.
- Tạo bucket lịch hôm nay, ngày mai, tất cả, ngày được chọn và calendar grid.

## Task liên quan phân quyền

- `createSchedule` cần được gọi sau khi đã kiểm tra `canCreateSchedule`.
- `updateMeetingLocation` chỉ dành cho quyền `canAssignMeetingLocation`.
- `deleteSchedule` chỉ dành cho quyền `canDeleteSchedule`.
- Khi thêm `teacherUid`, service cần ghi vào lịch để rules kiểm soát.

