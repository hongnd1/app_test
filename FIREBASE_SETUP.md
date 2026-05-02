# Firebase Setup

## Mục tiêu

App hiện dùng:

- Firebase Authentication với `email/password`
- Firestore collection `students`
- Firestore collection `schedules`
- Firestore document `users/{uid}` để lấy `displayName` và `role`
- Firestore collection `notificationTokens` để lưu token FCM của từng thiết bị
- Firebase Cloud Functions để gửi push notification

App frontend vẫn chạy bằng static hosting như GitHub Pages vì đang dùng Firebase CDN modules.

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

Ví dụ:

```json
{
  "displayName": "Nguyễn Đình Hồng",
  "role": "admin"
}
```

Các role app hiện hỗ trợ:

- `admin`
- `staff`
- `viewer`

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

    match /notificationTokens/{tokenId} {
      allow create: if request.auth != null
        && request.resource.data.uid == request.auth.uid;

      allow read: if request.auth != null
        && (
          resource.data.uid == request.auth.uid
          || userRole() == "admin"
        );

      allow update, delete: if request.auth != null
        && resource.data.uid == request.auth.uid;
    }
  }
}
```

## 4. Dữ liệu students

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

## 5. Dữ liệu schedules

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
  "meetingLocation": "",
  "meetingLocationStatus": "pending",
  "teacherReminderNote": "Cần hẹn địa điểm chạy DAT với học viên.",
  "teacherConfirmed": false,
  "reminderCreatedAt": "2026-05-02T08:30:00.000Z",
  "reminderUpdatedAt": "2026-05-02T08:30:00.000Z",
  "meetingNote": "",
  "notificationStatus": "pending",
  "notifiedAt": null,
  "datCreatedNotificationSentAt": null,
  "createdAt": "2026-05-02T08:30:00.000Z",
  "updatedAt": "2026-05-02T08:30:00.000Z"
}
```

## 6. Quy tắc ca DAT

App chỉ cho tạo lịch theo 3 ca cố định:

- `Ca sáng`: `06:00 - 11:30`
- `Ca chiều`: `13:00 - 17:00`
- `Ca tối`: `18:00 - 21:00`

## 7. FCM + Cloud Functions Notification

### Frontend

Frontend chỉ:

- xin quyền Notification
- lấy FCM token
- lưu token vào Firestore collection `notificationTokens`

Frontend không gửi FCM trực tiếp và không chứa server key.

### Bật Firebase Cloud Messaging

Trong Firebase Console:

1. Vào `Project settings`
2. Chọn tab `Cloud Messaging`
3. Bật / cấu hình Web Push nếu chưa có

### Lấy VAPID key

Trong `Firebase Console > Project settings > Cloud Messaging > Web configuration`

- tạo hoặc xem `Web Push certificates`
- copy `Key pair`
- dán public key vào:

`src/logic/notification/notificationService.js`

Tại hằng số:

`VAPID_KEY_PLACEHOLDER`

### notificationTokens

Mỗi thiết bị được bật thông báo sẽ tạo một document:

Collection:

`notificationTokens`

Ví dụ:

```json
{
  "uid": "firebase-auth-uid",
  "email": "admin@example.com",
  "displayName": "Admin Test",
  "role": "admin",
  "token": "FCM_DEVICE_TOKEN",
  "platform": "web",
  "userAgent": "Mozilla/5.0 ...",
  "enabled": true,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### Cloud Functions deploy

```bash
cd functions
npm install
firebase deploy --only functions
```

### Authorized domain cho GitHub Pages

Trong Firebase Console:

`Authentication > Settings > Authorized domains`

Thêm domain GitHub Pages của bạn, ví dụ:

- `hongnd1.github.io`

### URL app cho notification click

Trong:

`functions/index.js`

Hiện đang có:

```js
const APP_URL = "https://hongnd1.github.io/app_test/";
```

Nếu URL production khác, cần sửa lại trước khi deploy functions.

### iPhone / iOS

iPhone/iPad chỉ nhận Web Push tốt khi:

- iOS/iPadOS hỗ trợ Web Push
- user thêm web app vào Home Screen
- mở app từ icon Home Screen
- bấm `Bật thông báo`

### Hành vi notification hiện tại

1. Khi tạo lịch DAT mới:
   - Cloud Function `notifyDatScheduleCreated` gửi push tới thiết bị admin/staff đã đăng ký token

2. Lúc `21:00` và `22:00`:
   - frontend đang mở sẽ hiện reminder nội bộ cho admin
   - Cloud Function `sendPendingDatReminder` có thể gửi push nhắc nếu còn lịch `pending`

### Giới hạn hiện tại

- Nếu app web đang đóng hoàn toàn, reminder client-side `21:00` / `22:00` sẽ không tự chạy
- Push khi app đóng chỉ hoạt động nếu:
  - token đã được lưu
  - Cloud Functions đã deploy
  - browser cho phép notification
- Nếu app chưa được cấp quyền Notification thì Cloud Function vẫn gửi nhưng thiết bị sẽ không hiện thông báo
- Không có backend scheduler riêng ngoài Firebase Cloud Functions

## 8. Test checklist

1. Login bằng `admin`
2. Dashboard hiển thị nút `Bật thông báo`
3. Bấm `Bật thông báo`
4. Cho phép notification
5. Firestore xuất hiện document trong `notificationTokens`
6. Tạo lịch DAT mới
7. Cloud Function `notifyDatScheduleCreated` chạy
8. Thiết bị admin/staff nhận notification `Lịch DAT mới`
9. Login bằng `viewer`
10. `viewer` không thấy nút `Bật thông báo`
11. Nếu token invalid thì function không crash và token bị disable
12. Reload app vẫn hoạt động bình thường
13. Trên GitHub Pages, service worker register đúng `./firebase-messaging-sw.js`
