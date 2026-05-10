# Luồng đăng nhập đề xuất sau khi quét code

## 1. Hiện trạng trong code

Code hiện tại đang dùng Firebase Auth để xác thực và Firestore `users/{uid}` để lấy quyền.

Các điểm chính:

- `src/logic/auth/firebaseAuthService.js` hỗ trợ email/password và Google popup.
- Sau login, `verifyAuthorizedProfile()` bắt buộc phải đọc được `users/{uid}`.
- Nếu thiếu `users/{uid}`, service gọi `signOut(auth)` và trả lỗi `profile/missing`.
- `subscribe()` trong auth service cũng chỉ build session khi đọc được `users/{uid}`.
- Role hiện tại là `host`, `admin`, `staff`, `viewer`.
- `main.js` chỉ có 2 trạng thái lớn: chưa auth/loading/login hoặc đã có `session` thì vào dashboard.
- Chưa có màn onboarding, pending approval, rejected application.

Điều này nghĩa là người dùng mới đăng nhập Firebase thành công nhưng chưa có profile app sẽ bị đá ra login. Luồng mới cần giữ Firebase session và chuyển sang trạng thái đăng ký/chờ duyệt.

## 2. Luồng đăng nhập mới

Firebase Auth chỉ trả lời câu hỏi: người này là ai.

Firestore trả lời các câu hỏi:

- Người này đã có profile app chưa?
- Role gốc là gì?
- Tài khoản đã được duyệt chưa?
- Tài khoản đang active hay deactive?
- Người này có application đang chờ duyệt hoặc bị từ chối không?

Luồng tổng quát:

```txt
Firebase Auth
  -> Không có firebaseUser
    -> loggedOut
  -> Có firebaseUser
    -> Đọc users/{uid}
      -> Có profile
        -> approvalStatus != approved
          -> pending/rejected theo role
        -> approvalStatus approved hoặc host thủ công
          -> build session theo role + status + effectiveRole
      -> Không có profile
        -> Đọc teacherApplications/{uid}
          -> pending/rejected nếu có
        -> Đọc studentApplications/{uid}
          -> pending/rejected nếu có
        -> Không có gì
          -> needOnboarding
```

## 3. Auth state cần có

| State | Ý nghĩa | UI |
|---|---|---|
| `checking` | Đang kiểm tra Firebase và Firestore | Loading |
| `loggedOut` | Chưa đăng nhập Firebase | Login |
| `needOnboarding` | Có Firebase user nhưng chưa có profile/application | Chọn Học sinh/Giáo viên |
| `pendingTeacherApproval` | Giáo viên chờ host duyệt | Màn chờ duyệt |
| `pendingStudentApproval` | Học sinh chờ teacher duyệt | Màn chờ duyệt |
| `teacherRejected` | Hồ sơ giáo viên bị từ chối | Màn bị từ chối |
| `studentRejected` | Hồ sơ học sinh bị từ chối | Màn bị từ chối |
| `ready` | Được vào app | Dashboard |
| `error` | Lỗi hệ thống/rules/query | Error |

## 4. Data model đăng nhập

### `users/{uid}`

Chỉ tạo document này khi user được duyệt hoặc được admin hệ thống seed thủ công.

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

Với học sinh:

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

## 5. Pseudo code auth service mới

```js
async function resolveAuthState(firebaseUser) {
  if (!firebaseUser) {
    return { state: "loggedOut", session: null };
  }

  const profile = await getUserProfileOrNull(firebaseUser.uid);
  if (profile) {
    if (profile.approvalStatus && profile.approvalStatus !== "approved") {
      return resolveProfileApprovalState(profile);
    }

    return {
      state: "ready",
      session: buildSession(firebaseUser, profile),
    };
  }

  const teacherApplication = await getApplicationOrNull("teacherApplications", firebaseUser.uid);
  if (teacherApplication?.status === "pending") {
    return { state: "pendingTeacherApproval", application: teacherApplication };
  }
  if (teacherApplication?.status === "rejected") {
    return { state: "teacherRejected", application: teacherApplication };
  }

  const studentApplication = await getApplicationOrNull("studentApplications", firebaseUser.uid);
  if (studentApplication?.status === "pending") {
    return { state: "pendingStudentApproval", application: studentApplication };
  }
  if (studentApplication?.status === "rejected") {
    return { state: "studentRejected", application: studentApplication };
  }

  return { state: "needOnboarding", firebaseUser };
}
```

## 6. Build session

```js
function normalizeRole(role) {
  const normalized = String(role ?? "").trim().toLowerCase();
  const migratedRole = {
    admin: "teacher",
    staff: "student",
    view: "viewer",
    viewr: "viewer",
  }[normalized] || normalized;

  return ROLE_PERMISSIONS[migratedRole] ? migratedRole : "viewer";
}

function getEffectiveRole(profile) {
  const role = normalizeRole(profile?.role);
  if (role === "host") return "host";
  return profile?.status === "active" ? role : "viewer";
}

function buildSession(firebaseUser, profile) {
  const role = normalizeRole(profile?.role);
  const effectiveRole = getEffectiveRole(profile);

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || profile?.email || "",
    displayName: profile?.displayName || firebaseUser.displayName || firebaseUser.email || "Người dùng",
    role,
    status: profile?.status || "deactive",
    approvalStatus: profile?.approvalStatus || "approved",
    effectiveRole,
    teacherUid: profile?.teacherUid || "",
    studentId: profile?.studentId || "",
    roleLabel: ROLE_LABELS[effectiveRole] || ROLE_LABELS.viewer,
    permissions: ROLE_PERMISSIONS[effectiveRole] || ROLE_PERMISSIONS.viewer,
  };
}
```

## 7. UI cần thêm

- `OnboardingRoleScreen`: chọn `Học sinh` hoặc `Giáo viên`.
- `TeacherApplicationScreen`: form gửi hồ sơ giáo viên.
- `StudentApplicationScreen`: chọn giáo viên và gửi hồ sơ học sinh.
- `PendingApprovalScreen`: hiển thị trạng thái chờ duyệt.
- `RejectedApplicationScreen`: hiển thị trạng thái bị từ chối.
- `HostTeacherApprovalPanel`: host duyệt giáo viên.
- `TeacherStudentApprovalPanel`: teacher duyệt học sinh thuộc mình.

## 8. File code cần sửa

| File | Việc cần làm |
|---|---|
| `src/logic/auth/firebaseAuthService.js` | Đổi role mới, thêm `resolveAuthState`, không sign out khi thiếu profile |
| `src/app/main.js` | Thêm `authState`, render onboarding/pending/rejected |
| `src/ui/screens/LoginScreen.js` | Giữ nhiệm vụ login, không tự quyết dashboard |
| `src/ui/screens/*` | Thêm các màn onboarding/application/approval |
| `src/logic/notification/notificationModeService.js` | Dùng permission thay vì role cũ |
| `src/logic/notification/notificationService.js` | Dùng `canEnablePushNotifications` thay vì `host/admin/staff` |
| `firestore.rules` | Đổi rules sang `host/teacher/student/viewer`, thêm application rules |
| `firestore.indexes.json` | Thêm index cho application, students, schedules nếu query theo role mới |

## 9. Firebase cần update

Chi tiết code Firebase cần update được viết riêng tại:

- `docs/FIREBASE_UPDATE_DE_XUAT.md`

File đó có:

- Prototype `firestore.rules`.
- `firestore.indexes.json` đề xuất.
- Script migrate role cũ `admin/staff` sang `teacher/student`.
- Script seed host thủ công.

