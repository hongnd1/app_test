# Firebase Setup

## Muc tieu

App hien dang dung:

- Firebase Authentication voi `email/password`
- Firestore collection `students`
- Firestore collection `schedules`
- Firestore document `users/{uid}` de lay `displayName` va `role`
- Firestore collection `notificationTokens` de luu token FCM theo thiet bi
- Notification mode theo config: `off`, `realtime`, `fcm`
- Firebase Cloud Functions cho push notification o mode `fcm`

Frontend van chay duoc tren static hosting nhu GitHub Pages vi dang dung Firebase CDN modules.

## 1. Bật Firebase Authentication

Trong Firebase Console:

1. Vao `Authentication`
2. Chon `Sign-in method`
3. Bật `Email/Password`
4. Bật thêm `Google` nếu muốn dùng đăng nhập Google song song với email/password
5. Trong phần `Authorized domains`, đảm bảo domain đang chạy app đã được thêm vào

Sau do tao user trong tab `Users`.

Lưu ý cho đăng nhập Google:

- Với đăng nhập Google, user không bắt buộc phải tạo trước trong tab `Users`.
- Nhưng sau khi đăng nhập thành công qua Google, app vẫn yêu cầu phải có document `users/{uid}` trong Firestore để cấp quyền.
- Nếu thiếu `users/{uid}`, app sẽ tự đăng xuất lại và báo rõ tài khoản chưa được cấp quyền.

## 2. Tao users/{uid}

Moi user dang nhap phai co document trong collection `users`.

Document ID:

- chinh la `uid` cua Firebase Auth user

Vi du:

```json
{
  "displayName": "Nguyen Dinh Hong",
  "role": "admin"
}
```

Role frontend hien ho tro:

- `host`
- `admin`
- `staff`
- `viewer`

Ghi chu:

- `host` dung de doi notification mode tren thiet bi hien tai.
- `host` khong tu dong co them quyen Firestore backend. Neu can, phai cap nhat rules rieng.

## 3. Firestore Rules de xuat

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

## 4. Du lieu students

```json
{
  "id": "HS001",
  "ten": "Nguyen Van An",
  "sdt": "0912345678",
  "tenZalo": "An Nguyen",
  "cccd": "012345678901",
  "loaiBang": "B tu dong",
  "tongHocPhi": 10000000,
  "daNop": 6000000,
  "daHocLyThuyet": true,
  "soKmDAT": 320,
  "daHocSaHinh": false
}
```

## 5. Du lieu schedules

```json
{
  "id": "DAT001",
  "studentId": "HS001",
  "studentName": "Nguyen Van An",
  "studentPhone": "0912345678",
  "studentZaloName": "An Nguyen",
  "licenseType": "B tu dong",
  "date": "2026-05-02",
  "slotKey": "morning",
  "slotLabel": "Ca sang",
  "startTime": "06:00",
  "endTime": "11:30",
  "note": "Chuan bi xe san A",
  "meetingLocation": "",
  "meetingLocationStatus": "pending",
  "teacherReminderNote": "Can hen dia diem chay DAT voi hoc vien.",
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

## 6. Quy tac ca DAT

App chi cho tao lich theo 3 ca co dinh:

- `Ca sang`: `06:00 - 11:30`
- `Ca chieu`: `13:00 - 17:00`
- `Ca toi`: `18:00 - 21:00`

## 7. Notification Modes

Config nam tai:

`src/data/config/notificationConfig.js`

Mac dinh hien tai:

```js
mode: "realtime"
```

Co 3 mode:

### off

- Tat toan bo thong bao
- Khong register service worker
- Khong dung FCM
- Khong dung Firestore realtime notification listener
- Dashboard an nut bat thong bao

### realtime

- Day la mode mac dinh hien tai
- Khong can Firebase Blaze
- Khong can Cloud Functions
- Khong can VAPID key
- Dung `onSnapshot` de bao lich DAT moi khi admin/staff dang mo web app
- Khi mo app len van hien card DAT pending
- Neu browser da cap quyen Notification thi co the hien browser notification local

### fcm

- Chi dung khi Firebase project da nang cap Blaze
- Can VAPID key
- Can deploy Cloud Functions
- Co the gui push khi app dang dong

## 8. Cach doi mode

Sua truc tiep:

`src/data/config/notificationConfig.js`

Vi du:

```js
mode: "realtime"
```

Doi thanh:

```js
mode: "fcm"
```

hoac:

```js
mode: "off"
```

App cung cho phep override de test nhanh bang `localStorage`:

```js
localStorage.setItem("notificationMode", "off")
localStorage.setItem("notificationMode", "realtime")
localStorage.setItem("notificationMode", "fcm")
localStorage.removeItem("notificationMode")
```

Role `host` co them quyen doi mode ngay trong UI. Cai dat nay chi ap dung tren thiet bi/trinh duyet hien tai vi dang luu bang `localStorage`.

## 9. FCM + Cloud Functions Notification

### Frontend

Frontend chi:

- xin quyen Notification
- lay FCM token
- luu token vao Firestore collection `notificationTokens`

Frontend khong gui FCM truc tiep va khong chua server key.

### Bat Firebase Cloud Messaging

Trong Firebase Console:

1. Vao `Project settings`
2. Chon tab `Cloud Messaging`
3. Bat / cau hinh Web Push neu chua co

### Lay VAPID key

Trong:

`Firebase Console > Project settings > Cloud Messaging > Web configuration`

- tao hoac xem `Web Push certificates`
- copy public VAPID key
- dan vao:

`src/data/config/notificationConfig.js`

Tai field:

```js
vapidKey: ""
```

### notificationTokens

Moi thiet bi duoc bat push notification se tao mot document:

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

Chi deploy khi:

- `notificationConfig.mode = "fcm"`
- project da len Blaze

Lenh:

```bash
cd functions
npm install
firebase deploy --only functions
```

Neu chua len Blaze thi khong can deploy `functions/`.

### Authorized domain cho GitHub Pages

Trong Firebase Console:

`Authentication > Settings > Authorized domains`

Them domain GitHub Pages cua ban, vi du:

- `hongnd1.github.io`

### URL app cho notification click

Trong:

`functions/index.js`

Hien dang co:

```js
const APP_URL = "https://hongnd1.github.io/app_test/";
```

Neu URL production khac, can sua lai truoc khi deploy functions.

### iPhone / iOS

iPhone/iPad chi nhan Web Push tot khi:

- iOS/iPadOS ho tro Web Push
- user them web app vao Home Screen
- mo app tu icon Home Screen
- bam nut bat thong bao

## 10. Hanh vi thong bao hien tai

### Khi mode = realtime

1. Admin/staff mo app
2. App lang nghe `schedules` bang `onSnapshot`
3. Neu co lich DAT moi duoc them, app hien toast trong app
4. Neu browser da cap quyen Notification, app hien browser notification local

### Khi mode = fcm

1. User bam `Bat push notification`
2. App xin quyen Notification
3. App register service worker
4. App lay FCM token va luu vao `notificationTokens`
5. Cloud Function `notifyDatScheduleCreated` gui push khi co lich DAT moi
6. Cloud Function `sendPendingDatReminder` gui nhac vao 21:00 va 22:00 neu con lich pending

### Khi mode = off

- App van dang nhap va doc du lieu binh thuong
- Khong khoi dong notification listener
- Khong bat FCM
- Khong hien nut bat thong bao

## 11. Gioi han hien tai

- Mode `realtime` chi thong bao khi web app dang mo
- Mode `realtime` khong can Blaze va khong can Cloud Functions
- Mode `fcm` chi nen bat khi da co Blaze, VAPID key va Functions
- Neu app web dang dong hoan toan thi mode `realtime` khong tu chay thong bao
- Neu browser chua duoc cap quyen Notification thi cloud function van gui, nhung thiet bi se khong hien thong bao
- Khong co backend scheduler rieng ngoai Firebase Cloud Functions
- `FUNCTIONS_ENABLED=false` co the duoc dung trong Cloud Functions de tat trigger ma khong can xoa code

## 12. Test checklist

### mode = off

1. App van dang nhap duoc
2. Khong hien nut bat thong bao
3. Khong co loi console
4. Khong chay FCM
5. Khong chay realtime notification listener

### mode = realtime

1. Khong can VAPID key
2. Khong can Cloud Functions
3. Admin/staff mo app, tao lich DAT tu tab khac thi nhan thong bao trong app
4. Mo app len thay card DAT pending
5. Viewer khong thay nut thong bao

### mode = fcm

1. Neu `vapidKey` rong, bam bat push thi app bao loi than thien
2. Neu `vapidKey` co gia tri, app lay token va luu `notificationTokens`
3. Khong anh huong card DAT pending
4. Foreground message van hien toast khi app dang mo

### chung

1. Khong co thong bao trung nhieu lan khi render lai
2. Logout thi unsubscribe listener
3. Login user khac thi listener duoc reset theo role moi
4. Trinh duyet GitHub Pages van register dung `./firebase-messaging-sw.js` khi o mode `fcm`
