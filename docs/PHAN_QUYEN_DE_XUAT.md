# Phân quyền đề xuất sau khi quét code

## 1. Hiện trạng trong code

Phân quyền hiện tại nằm chủ yếu ở:

- `src/logic/auth/firebaseAuthService.js`
- `src/app/main.js`
- `src/ui/screens/DashboardScreen.js`
- `src/ui/components/StudentCard.js`
- `src/ui/components/StudentDetail.js`
- `src/ui/components/StudentForm.js`
- `src/logic/notification/notificationModeService.js`
- `src/logic/notification/notificationService.js`
- `firestore.rules`

Role hiện tại:

- `host`
- `admin`
- `staff`
- `viewer`

Permission hiện tại:

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

Rules hiện tại:

- `admin` tạo/sửa/xóa học viên và lịch.
- `staff` chỉ sửa `soKmDAT` và tạo lịch.
- Mọi user có `users/{uid}` đều đọc được `students` và `schedules`.
- `notificationTokens` cho user tự tạo token, `admin` đọc được token.

## 2. Mục tiêu role mới

Role chuẩn mới:

- `host`
- `teacher`
- `student`
- `viewer`

Mapping từ role cũ:

| Role cũ | Role mới |
|---|---|
| `host` | `host` |
| `admin` | `teacher` |
| `staff` | `student` |
| `viewer` | `viewer` |
| role sai/rỗng | `viewer` |

## 3. Nguyên tắc tính quyền

Không dùng `role` trực tiếp để render nút hoặc cho phép handler chạy.

Luồng đúng:

```txt
users/{uid}.role
  -> normalizeRole
  -> xét users/{uid}.approvalStatus
  -> xét users/{uid}.status
  -> effectiveRole
  -> permissions
```

`host` không bị hạ quyền theo `status`.

Các role khác:

- `status = active`: giữ quyền theo role.
- `status = deactive`: `effectiveRole = viewer`.
- `approvalStatus != approved`: không vào dashboard nghiệp vụ.

## 4. Permission mới

Giữ các permission hiện tại và bổ sung:

- `canViewStudents`
- `canViewStudentsByTeacher`
- `canApproveTeacher`
- `canApproveStudent`

Danh sách đầy đủ:

```js
const PERMISSION_KEYS = [
  "canViewStudents",
  "canViewStudentsByTeacher",
  "canCreateStudent",
  "canEditStudent",
  "canEditStudentDat",
  "canDeleteStudent",
  "canViewSensitiveStudentInfo",
  "canCreateSchedule",
  "canDeleteSchedule",
  "canAssignMeetingLocation",
  "canEnablePushNotifications",
  "canSetNotificationMode",
  "canApproveTeacher",
  "canApproveStudent",
];
```

## 5. Bảng quyền

| Permission | `host` | `teacher` | `student` | `viewer` |
|---|---:|---:|---:|---:|
| `canViewStudents` | Có | Có | Có, hồ sơ mình | Có, cơ bản |
| `canViewStudentsByTeacher` | Có | Không | Không | Không |
| `canCreateStudent` | Không | Có | Không | Không |
| `canEditStudent` | Không | Có | Không | Không |
| `canEditStudentDat` | Không | Có | Có, hồ sơ mình | Không |
| `canDeleteStudent` | Không | Có | Không | Không |
| `canViewSensitiveStudentInfo` | Có, tổng quan | Có | Không | Không |
| `canCreateSchedule` | Không | Có | Có, hồ sơ mình | Không |
| `canDeleteSchedule` | Không | Có | Không | Không |
| `canAssignMeetingLocation` | Không | Có | Không | Không |
| `canEnablePushNotifications` | Không | Có | Có | Không |
| `canSetNotificationMode` | Có | Không | Không | Không |
| `canApproveTeacher` | Có | Không | Không | Không |
| `canApproveStudent` | Không | Có | Không | Không |

## 6. Permission object đề xuất

```js
export const ROLE_PERMISSIONS = {
  host: {
    canViewStudents: true,
    canViewStudentsByTeacher: true,
    canCreateStudent: false,
    canEditStudent: false,
    canEditStudentDat: false,
    canDeleteStudent: false,
    canViewSensitiveStudentInfo: true,
    canCreateSchedule: false,
    canDeleteSchedule: false,
    canAssignMeetingLocation: false,
    canEnablePushNotifications: false,
    canSetNotificationMode: true,
    canApproveTeacher: true,
    canApproveStudent: false,
  },
  teacher: {
    canViewStudents: true,
    canViewStudentsByTeacher: false,
    canCreateStudent: true,
    canEditStudent: true,
    canEditStudentDat: true,
    canDeleteStudent: true,
    canViewSensitiveStudentInfo: true,
    canCreateSchedule: true,
    canDeleteSchedule: true,
    canAssignMeetingLocation: true,
    canEnablePushNotifications: true,
    canSetNotificationMode: false,
    canApproveTeacher: false,
    canApproveStudent: true,
  },
  student: {
    canViewStudents: true,
    canViewStudentsByTeacher: false,
    canCreateStudent: false,
    canEditStudent: false,
    canEditStudentDat: true,
    canDeleteStudent: false,
    canViewSensitiveStudentInfo: false,
    canCreateSchedule: true,
    canDeleteSchedule: false,
    canAssignMeetingLocation: false,
    canEnablePushNotifications: true,
    canSetNotificationMode: false,
    canApproveTeacher: false,
    canApproveStudent: false,
  },
  viewer: {
    canViewStudents: true,
    canViewStudentsByTeacher: false,
    canCreateStudent: false,
    canEditStudent: false,
    canEditStudentDat: false,
    canDeleteStudent: false,
    canViewSensitiveStudentInfo: false,
    canCreateSchedule: false,
    canDeleteSchedule: false,
    canAssignMeetingLocation: false,
    canEnablePushNotifications: false,
    canSetNotificationMode: false,
    canApproveTeacher: false,
    canApproveStudent: false,
  },
};
```

## 7. Phạm vi dữ liệu

### `host`

- Đọc tổng quan học viên và tiến độ theo giáo viên.
- Duyệt/từ chối giáo viên.
- Đổi notification mode.
- Không ghi dữ liệu nghiệp vụ học viên/lịch.

### `teacher`

- CRUD học viên thuộc `teacherUid = currentUid`.
- CRUD lịch thuộc học viên của mình.
- Duyệt học sinh có `studentApplications.teacherUid = currentUid`.
- Nhận notification nghiệp vụ.

### `student`

- Đọc hồ sơ học viên gắn với `studentUserUid = currentUid`.
- Cập nhật `soKmDAT` của hồ sơ mình.
- Tạo lịch DAT cho hồ sơ mình.
- Không xem thông tin nhạy cảm.

### `viewer`

- Chỉ đọc dữ liệu cơ bản nếu rules cho phép.
- Không ghi dữ liệu.
- Là fallback cho role sai hoặc tài khoản deactive.

## 8. File code cần sửa

| File | Việc cần sửa |
|---|---|
| `src/logic/auth/firebaseAuthService.js` | Đổi role/permission object, thêm `effectiveRole` |
| `src/app/main.js` | Thêm permission mới vào `defaultPermissions`; handler check đủ quyền |
| `src/ui/components/StudentDetail.js` | Đổi helper `Admin/Staff` sang permission-based |
| `src/ui/components/StudentForm.js` | Tách full edit và DAT-only theo permission |
| `src/ui/components/StudentCard.js` | Ẩn dữ liệu nhạy cảm theo `canViewSensitiveStudentInfo` |
| `src/logic/student/studentService.js` | Thêm API update DAT riêng; ghi `teacherUid`, `studentUserUid` |
| `src/logic/schedule/scheduleService.js` | Ghi `teacherUid`, `studentUserUid`, `createdByUid` vào lịch |
| `src/logic/notification/*` | Dùng permission mới, bỏ role cũ |
| `firestore.rules` | Enforce role mới và phạm vi dữ liệu |

## 9. Firebase cần update

Chi tiết code Firebase cần update được viết riêng tại:

- `docs/FIREBASE_UPDATE_DE_XUAT.md`

Mỗi khi task sau này cần đổi Firestore collection, rules hoặc indexes, tài liệu update Firebase phải được cập nhật cùng commit để có code kiểm tra trước khi deploy.

