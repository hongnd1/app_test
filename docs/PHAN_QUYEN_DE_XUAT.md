# Phân quyền đề xuất

## Mục tiêu

Mô hình phân quyền mới thay thế bộ role cũ `host`, `admin`, `staff`, `viewer` bằng 4 role chuẩn:

- `host`
- `teacher`
- `student`
- `viewer`

Quyền thực tế không chỉ phụ thuộc vào `role`, mà còn phụ thuộc vào `status` và `approvalStatus`.

## Khái niệm chính

### `role`

Role gốc được lưu trong `users/{uid}`. Đây là quyền được cấp sau khi tài khoản được tạo thủ công hoặc được duyệt.

### `status`

Trạng thái vận hành của tài khoản sau khi đã được duyệt.

Giá trị hợp lệ:

- `active`
- `deactive`

Ngoại lệ: `host` không bị hạ quyền theo `status`.

### `approvalStatus`

Trạng thái phê duyệt tài khoản.

Giá trị hợp lệ:

- `pending`
- `approved`
- `rejected`

Tài khoản `pending` hoặc `rejected` không nên vào dashboard nghiệp vụ. App nên hiển thị màn chờ duyệt hoặc bị từ chối.

### `effectiveRole`

Role thực tế app dùng sau khi xét `role` và `status`.

```js
function getEffectiveRole(profile) {
  const role = normalizeRole(profile?.role);

  if (role === "host") {
    return "host";
  }

  if (profile?.status !== "active") {
    return "viewer";
  }

  return role;
}
```

## Normalize role

App chỉ chấp nhận các role chuẩn: `host`, `teacher`, `student`, `viewer`.

Gợi ý migrate:

| Role cũ | Role mới |
|---|---|
| `host` | `host` |
| `admin` | `teacher` |
| `staff` | `student` nếu là học viên, ngược lại `viewer` |
| `viewer` | `viewer` |
| `view`, `viewr`, rỗng, sai | `viewer` |

## Permission nội bộ

UI và handler nên kiểm tra permission thay vì kiểm tra role trực tiếp.

Danh sách permission đề xuất:

- `canViewStudents`
- `canViewStudentsByTeacher`
- `canCreateStudent`
- `canEditStudent`
- `canEditStudentDat`
- `canDeleteStudent`
- `canViewSensitiveStudentInfo`
- `canCreateSchedule`
- `canDeleteSchedule`
- `canAssignMeetingLocation`
- `canEnablePushNotifications`
- `canSetNotificationMode`
- `canApproveTeacher`
- `canApproveStudent`

## Bảng quyền tổng quan

| Permission | `host` | `teacher` | `student` | `viewer` |
|---|---:|---:|---:|---:|
| Xem danh sách học viên | Có | Có | Có, phạm vi của mình | Có, dữ liệu cơ bản |
| Xem học viên theo giáo viên | Có | Không | Không | Không |
| Tạo học viên | Không | Có | Không | Không |
| Sửa toàn bộ học viên | Không | Có | Không | Không |
| Sửa `soKmDAT` | Không | Có | Có, hồ sơ của mình | Không |
| Xóa học viên | Không | Có | Không | Không |
| Xem thông tin nhạy cảm | Có, phục vụ tổng quan | Có | Không | Không |
| Tạo lịch DAT | Không | Có | Có, phạm vi của mình | Không |
| Xóa lịch DAT | Không | Có | Không | Không |
| Cập nhật địa điểm hẹn | Không | Có | Không | Không |
| Bật thông báo | Không hoặc tùy UI host | Có | Có | Không |
| Đổi notification mode | Có | Không | Không | Không |
| Duyệt giáo viên | Có | Không | Không | Không |
| Duyệt học sinh | Không | Có, học sinh thuộc mình | Không | Không |

## Role `host`

Mục đích:

- Điều phối hệ thống.
- Quản lý notification mode.
- Duyệt giáo viên.
- Xem tiến độ học viên theo từng giáo viên.

Không phải role thao tác nghiệp vụ trực tiếp. `host` không tạo/sửa/xóa học viên, không tạo/xóa lịch DAT, không cập nhật địa điểm hẹn.

Permission:

```json
{
  "canViewStudents": true,
  "canViewStudentsByTeacher": true,
  "canCreateStudent": false,
  "canEditStudent": false,
  "canEditStudentDat": false,
  "canDeleteStudent": false,
  "canViewSensitiveStudentInfo": true,
  "canCreateSchedule": false,
  "canDeleteSchedule": false,
  "canAssignMeetingLocation": false,
  "canEnablePushNotifications": false,
  "canSetNotificationMode": true,
  "canApproveTeacher": true,
  "canApproveStudent": false
}
```

## Role `teacher`

Mục đích:

- Quản lý nghiệp vụ chính.
- Quản lý học viên thuộc mình.
- Duyệt học sinh đăng ký vào giáo viên đó.

Teacher được tạo/sửa/xóa học viên, đặt lịch DAT, xóa lịch, cập nhật địa điểm hẹn, xem thông tin nhạy cảm và bật thông báo. Teacher không đổi notification mode và không duyệt giáo viên khác.

Permission:

```json
{
  "canViewStudents": true,
  "canViewStudentsByTeacher": false,
  "canCreateStudent": true,
  "canEditStudent": true,
  "canEditStudentDat": true,
  "canDeleteStudent": true,
  "canViewSensitiveStudentInfo": true,
  "canCreateSchedule": true,
  "canDeleteSchedule": true,
  "canAssignMeetingLocation": true,
  "canEnablePushNotifications": true,
  "canSetNotificationMode": false,
  "canApproveTeacher": false,
  "canApproveStudent": true
}
```

## Role `student`

Mục đích:

- Tự theo dõi tiến độ học tập.
- Cập nhật km DAT cho hồ sơ của mình.
- Tạo lịch DAT trong phạm vi được phép.

Student không tạo hồ sơ học viên mới, không sửa thông tin nhạy cảm, không xóa lịch, không cập nhật địa điểm hẹn và không đổi notification mode.

Permission:

```json
{
  "canViewStudents": true,
  "canViewStudentsByTeacher": false,
  "canCreateStudent": false,
  "canEditStudent": false,
  "canEditStudentDat": true,
  "canDeleteStudent": false,
  "canViewSensitiveStudentInfo": false,
  "canCreateSchedule": true,
  "canDeleteSchedule": false,
  "canAssignMeetingLocation": false,
  "canEnablePushNotifications": true,
  "canSetNotificationMode": false,
  "canApproveTeacher": false,
  "canApproveStudent": false
}
```

## Role `viewer`

Mục đích:

- Chỉ xem dữ liệu cơ bản.
- Là quyền fallback khi role không hợp lệ hoặc tài khoản không active.

Viewer không được ghi dữ liệu nghiệp vụ.

Permission:

```json
{
  "canViewStudents": true,
  "canViewStudentsByTeacher": false,
  "canCreateStudent": false,
  "canEditStudent": false,
  "canEditStudentDat": false,
  "canDeleteStudent": false,
  "canViewSensitiveStudentInfo": false,
  "canCreateSchedule": false,
  "canDeleteSchedule": false,
  "canAssignMeetingLocation": false,
  "canEnablePushNotifications": false,
  "canSetNotificationMode": false,
  "canApproveTeacher": false,
  "canApproveStudent": false
}
```

## Cấu trúc Firestore cần có

### `users/{uid}`

```json
{
  "uid": "firebase_uid",
  "email": "user@example.com",
  "displayName": "Nguyễn Văn A",
  "role": "teacher",
  "status": "active",
  "approvalStatus": "approved",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp",
  "approvedAt": "serverTimestamp",
  "approvedBy": "host_uid"
}
```

### `students/{studentId}`

```json
{
  "id": "HS001",
  "ten": "Tên học viên",
  "teacherUid": "teacher_uid",
  "studentUserUid": "student_uid",
  "loaiBang": "B2",
  "soKmDAT": 0
}
```

`teacherUid` là khóa chính để:

- Teacher chỉ thấy dữ liệu của mình.
- Host nhóm tiến độ theo giáo viên.
- Rules kiểm soát phạm vi đọc/ghi.

## Rules backend

Firestore Rules phải đồng bộ với mô hình permission:

- `host` đọc dữ liệu tổng quan, giáo viên, học viên theo giáo viên và đổi notification mode.
- `host` không ghi dữ liệu nghiệp vụ học viên/lịch.
- `teacher` CRUD học viên/lịch trong phạm vi `teacherUid` của mình.
- `student` chỉ sửa trường được phép trên hồ sơ gắn với `studentUserUid`.
- `viewer` chỉ đọc dữ liệu cơ bản.
- `deactive` luôn bị giới hạn như `viewer`, kể cả khi role gốc là `teacher` hoặc `student`.

## Gợi ý triển khai

Toàn app nên dùng một hàm duy nhất để lấy permission:

```js
function hasPermission(session, key) {
  return Boolean(session?.permissions?.[key]);
}
```

Không nên rải logic kiểu `role === "teacher"` trong UI và service. Khi cần đổi quyền, chỉ cập nhật bảng permission và hàm build session.

## Audit log

Nên có `auditLogs/{logId}` cho các thao tác nhạy cảm:

- Host duyệt hoặc từ chối giáo viên.
- Teacher duyệt hoặc từ chối học sinh.
- Khóa hoặc mở lại tài khoản.
- Đổi notification mode.

Log tối thiểu nên có `actorUid`, `action`, `targetUid`, `before`, `after`, `createdAt`.

## Kết luận

Mô hình mới dùng `role` để lưu quyền gốc, `status` để bật/tắt tài khoản, `approvalStatus` để quản lý phê duyệt và `effectiveRole` để tính quyền thực tế. UI, service và Firestore Rules phải cùng dựa trên permission hiệu lực để tránh lệch quyền giữa frontend và backend.
