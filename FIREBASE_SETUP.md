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
- `staff`: chỉ tạo lịch, chỉ xem tên học viên và loại bằng, sửa `soKmDAT`

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
        : "staff";
    }

    function canReadAppData() {
      return isSignedIn() && userDoc().exists();
    }

    function isAdmin() {
      return userRole() == "admin";
    }

    function isStaff() {
      return userRole() == "staff";
    }

    function staffOnlyUpdatesDatKm() {
      return request.resource.data.diff(resource.data).changedKeys().hasOnly(["soKmDAT"]);
    }

    match /users/{uid} {
      allow read: if isSignedIn() && request.auth.uid == uid;
      allow write: if false;
    }

    match /students/{studentId} {
      allow read: if canReadAppData();
      allow create: if isAdmin();
      allow update: if isAdmin() || (isStaff() && staffOnlyUpdatesDatKm());
      allow delete: if isAdmin();
    }

    match /schedules/{scheduleId} {
      allow read: if canReadAppData();
      allow create: if isAdmin() || isStaff();
      allow update: if isAdmin();
      allow delete: if isAdmin();
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

## 6. Dữ liệu students

App đang dùng các field:

```json
{
  "id": "HS001",
  "ten": "Nguyễn Văn An",
  "sdt": "0912345678",
  "tenZalo": "An Nguyen",
  "cccd": "012345678901",
  "loaiBang": "B tự động",
  "tongHocPhi": 10000000,
  "daNop": 6000000,
  "daHocLyThuyet": true,
  "soKmDAT": 320,
  "daHocSaHinh": false
}
```

## 7. Dữ liệu schedules

App đang dùng các field:

```json
{
  "id": "DAT001",
  "studentId": "HS001",
  "studentName": "Nguyễn Văn An",
  "studentPhone": "0912345678",
  "studentZaloName": "An Nguyen",
  "licenseType": "B tự động",
  "date": "2026-05-02",
  "slotKey": "morning",
  "slotLabel": "Ca sáng",
  "startTime": "06:00",
  "endTime": "11:30",
  "note": "Chuẩn bị xe sân A",
  "meetingLocation": "Cổng trường lái xe số 2",
  "meetingLocationStatus": "confirmed",
  "teacherReminderNote": "Cần hẹn địa điểm chạy DAT với học viên.",
  "teacherConfirmed": true,
  "reminderCreatedAt": "2026-05-02T08:30:00.000Z",
  "reminderUpdatedAt": "2026-05-02T20:45:00.000Z",
  "meetingNote": "Có mặt trước 15 phút, mang theo CCCD",
  "notificationStatus": "ready",
  "notifiedAt": "2026-05-02T09:00:00.000Z",
  "createdAt": "2026-05-02T08:30:00.000Z"
}
```

## 8. Quy tắc ca DAT

App chỉ cho tạo lịch theo 3 ca cố định:

- `Ca sáng`: `06:00 - 11:30`
- `Ca chiều`: `13:00 - 17:00`
- `Ca tối`: `18:00 - 21:00`

## 9. Reminder nội bộ cho admin

Khi tạo lịch DAT mới, app tự gán:

```json
{
  "meetingLocation": "",
  "meetingLocationStatus": "pending",
  "teacherReminderNote": "Cần hẹn địa điểm chạy DAT với học viên.",
  "teacherConfirmed": false,
  "reminderCreatedAt": "ISO_DATE",
  "reminderUpdatedAt": "ISO_DATE"
}
```

Admin sẽ thấy reminder trong dashboard cho các lịch DAT còn `pending`.

Khi app đang mở và đang có phiên `admin`, web sẽ nhắc lúc:

- `21:00`
- `22:00`

Nếu browser đã cấp quyền Notification API, app sẽ hiện browser notification ngoài popup trong app.

## 10. Giới hạn hiện tại của notification

Tuy nhiên, để học viên nhận **push notification thật sự** trên điện thoại, bạn vẫn cần thêm:

- app/web riêng cho học viên
- Firebase Cloud Messaging
- token thiết bị của học viên
- service gửi notification

Repo hiện tại chưa có hạ tầng đó.

Nếu trình duyệt hoặc app web đang đóng hoàn toàn thì static web **không thể tự chạy lịch nhắc** vì không có backend scheduler. Đây là giới hạn đúng theo mô hình hiện tại.
