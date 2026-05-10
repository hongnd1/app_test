# Firebase update đã triển khai

## 1. Firestore instance

Đã kiểm tra ngày 2026-05-10 bằng Firebase CLI:

- Project: `blx-app-348b4`
- Database: `(default)`
- Edition: `STANDARD`
- Type: `FIRESTORE_NATIVE`
- Location: `asia-northeast1`

## 2. File Firebase đã cập nhật

- `firestore.rules`
- `firestore.indexes.json`
- `firebase.json` đang trỏ tới đúng 2 file trên.

Đã chạy dry-run:

```bash
npx -y firebase-tools@latest deploy --only firestore:rules,firestore:indexes --dry-run
```

Kết quả: `firestore.rules` compile thành công và dry-run hoàn tất.

## 3. Collection dùng trong luồng mới

| Collection | Document ID | Mục đích |
|---|---|---|
| `users` | Firebase Auth `uid` | Profile quyền đã duyệt |
| `teacherApplications` | Firebase Auth `uid` | Giáo viên chờ host duyệt |
| `studentApplications` | Firebase Auth `uid` | Học sinh chờ teacher duyệt |
| `students` | `HS...` | Hồ sơ học viên |
| `schedules` | `DAT...` | Lịch DAT |
| `notificationTokens` | `${uid}_${tokenHash}` | FCM token |
| `auditLogs` | auto id | Log nghiệp vụ |

## 4. Rules hiện đang enforce

- User mới chỉ được tạo application cho chính `request.auth.uid`.
- User không được tự tạo `users/{uid}` active.
- `host` duyệt/từ chối teacher application và tạo user role `teacher`.
- `teacher` duyệt/từ chối student application, tạo user role `student` và tạo hồ sơ `students`.
- `teacher` chỉ đọc/ghi `students` và `schedules` có `teacherUid = request.auth.uid`.
- `student` chỉ đọc hồ sơ/lịch có `studentUserUid = request.auth.uid`.
- `student` chỉ update trường `soKmDAT`.
- `viewer` không đọc collection nghiệp vụ có PII.
- Notification token chỉ cho user active ghi token của chính mình; host có thể đọc token.

## 5. Index hiện có

`firestore.indexes.json` hiện có composite indexes cho:

- `schedules`: `teacherUid + createdAt`
- `schedules`: `studentUserUid + createdAt`
- `users`: `role + status + approvalStatus`

Các query equality đơn field hoặc nhiều equality đơn giản còn lại dùng index tự động của Firestore Standard.

## 6. Code seed host thủ công

Chạy bằng Admin SDK, không chạy trong frontend.

```js
// scripts/seedHostUser.js
import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();
const uid = process.argv[2];
const email = process.argv[3];
const displayName = process.argv.slice(4).join(" ") || email;

if (!uid || !email) {
  console.error("Usage: node scripts/seedHostUser.js <uid> <email> [displayName]");
  process.exit(1);
}

await db.collection("users").doc(uid).set(
  {
    uid,
    email,
    displayName,
    role: "host",
    status: "active",
    approvalStatus: "approved",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    approvedBy: "system",
  },
  { merge: true },
);

console.log(`Seeded host user ${uid}`);
```

## 7. Code migrate role cũ

Chạy sau khi backup dữ liệu.

```js
// scripts/migrateRoles.js
import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();
const roleMap = {
  admin: "teacher",
  staff: "student",
  view: "viewer",
  viewr: "viewer",
};

const snapshot = await db.collection("users").get();
const batch = db.batch();
let count = 0;

snapshot.docs.forEach((doc) => {
  const data = doc.data();
  const currentRole = String(data.role || "").trim().toLowerCase();
  const nextRole = roleMap[currentRole] || currentRole || "viewer";

  if (nextRole !== currentRole || !data.approvalStatus || !data.status) {
    batch.set(
      doc.ref,
      {
        role: ["host", "teacher", "student", "viewer"].includes(nextRole) ? nextRole : "viewer",
        status: data.status || "active",
        approvalStatus: data.approvalStatus || "approved",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    count += 1;
  }
});

if (count > 0) {
  await batch.commit();
}

console.log(`Migrated ${count} users`);
```

## 8. Deploy sau khi review

```bash
npx -y firebase-tools@latest deploy --only firestore:rules
npx -y firebase-tools@latest deploy --only firestore:indexes
```

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for the proposed role model because they default to authenticated access, prevent users from creating their own active privileged `users/{uid}` profile, scope teacher/student writes by `teacherUid` and `studentUserUid`, and validate document fields on writes. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.
