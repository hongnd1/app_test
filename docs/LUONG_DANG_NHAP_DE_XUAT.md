# Luồng đăng nhập đề xuất

## Mục tiêu

Luồng đăng nhập mới tách rõ hai việc:

- Firebase Authentication xác thực danh tính.
- Firestore quyết định trạng thái tài khoản, vai trò và quyền sử dụng app.

App dùng 4 role chuẩn: `host`, `teacher`, `student`, `viewer`. Người dùng mới không được tự tạo role active. Họ chỉ được gửi hồ sơ đăng ký giáo viên hoặc học sinh, sau đó chờ người có quyền duyệt.

## Trạng thái đăng nhập

| State | Ý nghĩa | Màn hình |
|---|---|---|
| `checking` | App đang kiểm tra Firebase session và Firestore profile | Loading |
| `loggedOut` | Chưa đăng nhập Firebase | Login |
| `needOnboarding` | Đã đăng nhập Firebase nhưng chưa có profile hoặc application | Chọn Học sinh/Giáo viên |
| `pendingTeacherApproval` | Giáo viên mới đang chờ host duyệt | Chờ duyệt |
| `pendingStudentApproval` | Học sinh mới đang chờ giáo viên duyệt | Chờ duyệt |
| `teacherRejected` | Hồ sơ giáo viên bị từ chối | Thông báo từ chối |
| `studentRejected` | Hồ sơ học sinh bị từ chối | Thông báo từ chối |
| `ready` | Có profile hợp lệ và được vào app | Dashboard |
| `error` | Lỗi đọc dữ liệu hoặc lỗi hệ thống | Error |

Không còn coi việc thiếu `users/{uid}` là lỗi tuyệt đối. Với người dùng mới, thiếu profile là tín hiệu để chuyển sang onboarding hoặc kiểm tra hồ sơ chờ duyệt.

## Cấu trúc dữ liệu

### `users/{uid}`

Document này chỉ dành cho tài khoản đã được duyệt hoặc tài khoản được cấp thủ công.

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
  "approvedBy": "host_or_teacher_uid"
}
```

Với học sinh đã duyệt:

```json
{
  "uid": "firebase_uid",
  "email": "student@example.com",
  "displayName": "Trần Văn B",
  "role": "student",
  "status": "active",
  "approvalStatus": "approved",
  "teacherUid": "teacher_uid",
  "studentId": "students_doc_id",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp",
  "approvedAt": "serverTimestamp",
  "approvedBy": "teacher_uid"
}
```

### `teacherApplications/{uid}`

Dùng cho người dùng chọn đăng ký giáo viên.

```json
{
  "uid": "firebase_uid",
  "email": "teacher@example.com",
  "displayName": "Tên giáo viên",
  "phone": "",
  "note": "",
  "status": "pending",
  "createdAt": "serverTimestamp",
  "reviewedAt": null,
  "reviewedBy": null,
  "rejectReason": null
}
```

### `studentApplications/{uid}`

Dùng cho người dùng chọn đăng ký học sinh.

```json
{
  "uid": "firebase_uid",
  "email": "student@example.com",
  "displayName": "Tên học sinh",
  "teacherUid": "teacher_uid",
  "studentProfile": {
    "hoTen": "Tên học sinh",
    "loaiBang": "B2",
    "soDienThoai": "",
    "tenZalo": "",
    "cccd": "",
    "ghiChu": ""
  },
  "status": "pending",
  "createdAt": "serverTimestamp",
  "reviewedAt": null,
  "reviewedBy": null,
  "rejectReason": null
}
```

## Luồng tổng quát

1. Người dùng đăng nhập bằng email/password hoặc Google.
2. Firebase Auth trả về `firebaseUser`.
3. App đọc `users/{uid}`.
4. Nếu có `users/{uid}`, app normalize role, kiểm tra `approvalStatus`, kiểm tra `status`, tính `effectiveRole`, rồi vào dashboard nếu hợp lệ.
5. Nếu chưa có `users/{uid}`, app kiểm tra `teacherApplications/{uid}` và `studentApplications/{uid}`.
6. Nếu có application `pending`, app hiển thị màn chờ duyệt tương ứng.
7. Nếu application bị `rejected`, app hiển thị lý do từ chối hoặc hướng dẫn liên hệ.
8. Nếu không có profile và không có application, app chuyển sang onboarding lần đầu.

Pseudo flow:

```js
async function resolveAuthState(firebaseUser) {
  if (!firebaseUser) return { state: "loggedOut" };

  const profile = await getUserProfile(firebaseUser.uid);
  if (profile) {
    if (profile.approvalStatus && profile.approvalStatus !== "approved") {
      return resolvePendingState(profile);
    }

    return {
      state: "ready",
      session: buildSession(firebaseUser, profile),
    };
  }

  const teacherApplication = await getTeacherApplication(firebaseUser.uid);
  if (teacherApplication?.status === "pending") {
    return { state: "pendingTeacherApproval", application: teacherApplication };
  }
  if (teacherApplication?.status === "rejected") {
    return { state: "teacherRejected", application: teacherApplication };
  }

  const studentApplication = await getStudentApplication(firebaseUser.uid);
  if (studentApplication?.status === "pending") {
    return { state: "pendingStudentApproval", application: studentApplication };
  }
  if (studentApplication?.status === "rejected") {
    return { state: "studentRejected", application: studentApplication };
  }

  return { state: "needOnboarding" };
}
```

## Onboarding lần đầu

Sau khi đăng nhập Firebase nhưng chưa có profile hoặc application, app hiển thị hai lựa chọn:

- Tôi là học sinh.
- Tôi là giáo viên.

Không cho tự chọn `host` hoặc `viewer`. `host` phải được tạo thủ công, qua script seed an toàn hoặc quy trình quản trị riêng.

## Đăng ký giáo viên

1. User chọn `Giáo viên`.
2. App tạo `teacherApplications/{uid}` với `status = pending`.
3. User thấy màn chờ host phê duyệt.
4. Host duyệt hồ sơ.
5. Khi duyệt, hệ thống tạo hoặc cập nhật `users/{uid}` với `role = teacher`, `status = active`, `approvalStatus = approved`.
6. Hệ thống cập nhật `teacherApplications/{uid}.status = approved`.

Khi host từ chối:

- Cập nhật `teacherApplications/{uid}.status = rejected`.
- Lưu `rejectReason` nếu có.
- Không tạo quyền `teacher` active trong `users/{uid}`.

## Đăng ký học sinh

1. User chọn `Học sinh`.
2. App tải danh sách giáo viên có `role = teacher`, `status = active`, `approvalStatus = approved`.
3. Học sinh chọn giáo viên phụ trách và nhập thông tin cá nhân tối thiểu.
4. App tạo `studentApplications/{uid}` với `teacherUid` và `status = pending`.
5. Học sinh thấy màn chờ giáo viên xác nhận.
6. Giáo viên chỉ thấy application có `teacherUid = currentTeacherUid`.
7. Khi duyệt, giáo viên tạo hoặc cập nhật document trong `students`, gán `teacherUid` và `studentUserUid`.
8. Hệ thống tạo hoặc cập nhật `users/{uid}` với `role = student`, `status = active`, `approvalStatus = approved`, `teacherUid`, `studentId`.
9. Hệ thống cập nhật `studentApplications/{uid}.status = approved`.

Khi giáo viên từ chối:

- Cập nhật `studentApplications/{uid}.status = rejected`.
- Lưu `rejectReason` nếu có.
- Không tạo role `student` active trong `users/{uid}`.

## Tài khoản đã có profile

### `host`

- Vào dashboard với quyền host.
- Không bị hạ quyền theo `status`.
- Được đổi notification mode, duyệt giáo viên, xem tiến độ theo giáo viên.
- Không thao tác nghiệp vụ học viên/lịch.

### `teacher`

- Chỉ vào dashboard nghiệp vụ khi `approvalStatus = approved`.
- Nếu `status = active`, dùng quyền teacher.
- Nếu `status = deactive`, `effectiveRole = viewer`.

### `student`

- Chỉ vào dashboard khi đã được giáo viên duyệt.
- Nếu `status = active`, dùng quyền student.
- Nếu `status = deactive`, `effectiveRole = viewer`.

### `viewer`

- Chỉ xem dữ liệu cơ bản theo phạm vi UI và rules cho phép.
- Không tạo/sửa/xóa học viên, không tạo/xóa lịch, không bật notification role.

## Tính session

```js
function buildSession(firebaseUser, profile) {
  const role = normalizeRole(profile.role);
  const effectiveRole = role === "host"
    ? "host"
    : profile.status === "active"
      ? role
      : "viewer";

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: profile.displayName || firebaseUser.displayName || firebaseUser.email,
    role,
    status: profile.status,
    approvalStatus: profile.approvalStatus,
    effectiveRole,
    permissions: ROLE_PERMISSIONS[effectiveRole] || ROLE_PERMISSIONS.viewer,
  };
}
```

UI và handler nên dùng `session.permissions`, không rải điều kiện theo role trực tiếp.

## Màn hình cần bổ sung

- `OnboardingRoleScreen`: chọn Học sinh/Giáo viên.
- `TeacherApplicationScreen`: form đăng ký giáo viên.
- `StudentApplicationScreen`: form đăng ký học sinh và chọn giáo viên.
- `PendingApprovalScreen`: màn chờ duyệt dùng chung.
- `RejectedApplicationScreen`: hiển thị trạng thái bị từ chối.
- `TeacherApprovalPanel`: giáo viên duyệt học sinh thuộc mình.
- `HostTeacherApprovalPanel`: host duyệt giáo viên.
- `HostProgressByTeacherView`: host xem tiến độ nhóm theo `students.teacherUid`.

## Firestore Rules cần đáp ứng

- User mới chỉ được tạo application cho chính `uid` của mình.
- User không được tự tạo `users/{uid}` active với role `teacher` hoặc `student`.
- Chỉ `host` được duyệt giáo viên.
- Chỉ `teacher` phụ trách được duyệt học sinh thuộc `teacherUid` của mình.
- `teacher` chỉ CRUD học viên/lịch trong phạm vi mình quản lý.
- `student` chỉ cập nhật trường được phép, ví dụ `soKmDAT`, trên hồ sơ gắn với `studentUserUid`.
- `deactive` phải bị giới hạn như `viewer` ở backend, không chỉ ở UI.

## Thông báo lỗi cần có

- Chưa hoàn tất đăng ký: `Bạn cần chọn loại tài khoản để hoàn tất đăng ký.`
- Giáo viên chờ duyệt: `Tài khoản giáo viên của bạn đang chờ host phê duyệt.`
- Học sinh chờ duyệt: `Thông tin học sinh của bạn đang chờ giáo viên xác nhận.`
- Bị từ chối: `Yêu cầu đăng ký của bạn đã bị từ chối. Vui lòng liên hệ người phụ trách để biết thêm chi tiết.`
- Tài khoản deactive: `Tài khoản của bạn đang bị tắt. Bạn chỉ có thể xem dữ liệu cơ bản.`

## Kết luận

Luồng đăng nhập mới:

```txt
Firebase Login
  -> Có users/{uid}?
    -> Có: build session theo role + approvalStatus + status
    -> Không: kiểm tra teacherApplications/studentApplications
      -> Có pending/rejected: hiển thị trạng thái hồ sơ
      -> Không có: onboarding Học sinh/Giáo viên
```

Điểm quan trọng là không tạo quyền active từ frontend và không để UI là lớp bảo vệ duy nhất. Firestore Rules phải phản ánh đúng cùng một mô hình quyền.
