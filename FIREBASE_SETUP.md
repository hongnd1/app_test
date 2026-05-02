# Firebase Setup

## Mục tiêu

App hiện dùng:

- Firebase Authentication với `email/password`
- Firestore collection `students`
- Firestore collection `schedules`
- Firestore document `users/{uid}` để lấy `displayName` và `role`

App chạy được với static hosting như GitHub Pages vì đang dùng Firebase CDN modules.

## 1. Bật Firebase Authentication

Trong Firebase Console:

1. Vào `Authentication`
2. Chọn `Sign-in method`
3. Bật `Email/Password`

Sau đó tạo user trong tab `Users`.

## 2. Tạo document users/{uid}

Mỗi user đăng nhập phải có document:

Collection: `users`

Document ID:

- chính là `uid` của Firebase Auth user

Ví dụ dữ liệu:

```json
{
  "displayName": "Nguyễn Đình Hồng",
  "role": "admin"
}
```

Các role đang hỗ trợ:

- `admin`: toàn quyền
- `editor`: tạo/sửa học viên, tạo/xóa lịch
- `staff`: tạo/sửa học viên, tạo lịch
- `scheduler`: chỉ thao tác lịch
- `viewer`: chỉ xem

## 3. Firestore Rules đề xuất

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function userDoc() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid));
    }

    function userRole() {
      return isSignedIn() && userDoc().exists()
        ? userDoc().data.role
        : "viewer";
    }

    function canReadAppData() {
      return isSignedIn() && userDoc().exists();
    }

    function canManageStudents() {
      return userRole() in ["admin", "editor", "staff"];
    }

    function canDeleteStudents() {
      return userRole() == "admin";
    }

    function canManageSchedules() {
      return userRole() in ["admin", "editor", "staff", "scheduler"];
    }

    function canDeleteSchedules() {
      return userRole() in ["admin", "editor", "scheduler"];
    }

    match /users/{uid} {
      allow read: if isSignedIn() && request.auth.uid == uid;
      allow write: if false;
    }

    match /students/{studentId} {
      allow read: if canReadAppData();
      allow create, update: if canManageStudents();
      allow delete: if canDeleteStudents();
    }

    match /schedules/{scheduleId} {
      allow read: if canReadAppData();
      allow create, update: if canManageSchedules();
      allow delete: if canDeleteSchedules();
    }
  }
}
```

## 4. Tạo tài khoản test

Ví dụ bạn có thể tạo 2 user trong Firebase Authentication:

1. `admin@example.com`
2. `staff@example.com`

Sau đó tạo 2 document:

`users/<uid-admin>`

```json
{
  "displayName": "Admin Test",
  "role": "admin"
}
```

`users/<uid-staff>`

```json
{
  "displayName": "Staff Test",
  "role": "staff"
}
```

## 5. Lưu ý khi deploy GitHub Pages

- Firebase project phải thêm domain GitHub Pages của bạn vào `Authentication > Settings > Authorized domains`
- Ví dụ:
  `hongnd1.github.io`

Nếu không thêm domain này, login bằng Firebase Auth sẽ thất bại trên GitHub Pages.

## 6. Dữ liệu students và schedules

App đang dùng nguyên field hiện có:

### students

```json
{
  "id": "HS001",
  "ten": "Nguyễn Văn An",
  "cccd": "012345678901",
  "loaiBang": "B tự động",
  "tongHocPhi": 10000000,
  "daNop": 6000000,
  "daHocLyThuyet": true,
  "soKmDAT": 320,
  "daHocSaHinh": false
}
```

### schedules

```json
{
  "id": "DAT001",
  "studentId": "HS001",
  "studentName": "Nguyễn Văn An",
  "licenseType": "B tự động",
  "date": "2026-05-02",
  "startTime": "08:00",
  "endTime": "10:00",
  "note": "Ca sáng sân tập A",
  "createdAt": "2026-05-02T09:00:00.000Z"
}
```
