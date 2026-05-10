# `src/logic/auth/firebaseAuthService.js`

## Vai trò

Service đăng nhập Firebase và build session app từ Firestore profile.

## Trách nhiệm hiện tại

- Login bằng email/password.
- Login bằng Google popup.
- Logout.
- Subscribe `onAuthStateChanged`.
- Đọc `users/{uid}`.
- Normalize role hiện tại theo `host`, `admin`, `staff`, `viewer`.
- Build `session.permissions`.

## Task cần cập nhật theo luồng mới

- Đổi role chuẩn thành `host`, `teacher`, `student`, `viewer`.
- Thêm `approvalStatus`, `status`, `effectiveRole`.
- Không sign out ngay khi thiếu `users/{uid}`; thay vào đó trả về `needOnboarding` hoặc pending application state.
- Đọc thêm `teacherApplications/{uid}` và `studentApplications/{uid}`.
- Bổ sung message cho pending, rejected và deactive.

## Output đề xuất

Service nên trả về auth state rõ ràng:

```js
{
  state: "ready",
  session: {
    uid,
    email,
    displayName,
    role,
    status,
    approvalStatus,
    effectiveRole,
    permissions
  }
}
```

