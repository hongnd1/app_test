# Firebase update đề xuất

## 1. Thông tin Firestore hiện tại

Đã kiểm tra bằng Firebase CLI ngày 2026-05-10:

- Project: `blx-app-348b4`
- Database: `(default)`
- Edition: `STANDARD`
- Type: `FIRESTORE_NATIVE`
- Location: `asia-northeast1`

Vì database là Standard, index đơn field được tạo tự động. Query kết hợp nhiều field và sort cần composite index trong `firestore.indexes.json`.

## 2. Collection cần có

| Collection | Document ID | Mục đích |
|---|---|---|
| `users` | Firebase Auth `uid` | Profile quyền đã duyệt |
| `teacherApplications` | Firebase Auth `uid` | Hồ sơ giáo viên chờ host duyệt |
| `studentApplications` | Firebase Auth `uid` | Hồ sơ học sinh chờ teacher duyệt |
| `students` | `HSxxx` hoặc auto id | Hồ sơ học viên |
| `schedules` | `DATxxx` hoặc auto id | Lịch DAT |
| `notificationTokens` | `${uid}_${tokenHash}` | FCM token web |
| `auditLogs` | auto id | Log duyệt/khóa/quyền |

## 3. Code seed host thủ công

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

## 4. Code migrate role cũ

Chạy bằng Admin SDK sau khi đã backup dữ liệu.

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

## 5. Prototype `firestore.rules`

Đây là prototype để review trước khi thay file thật. Rules đang ưu tiên least privilege theo role mới và application flow mới.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function userPath(uid) {
      return /databases/$(database)/documents/users/$(uid);
    }

    function signedInUserDoc() {
      return get(userPath(request.auth.uid));
    }

    function hasUserDoc() {
      return isSignedIn() && exists(userPath(request.auth.uid));
    }

    function rawRole() {
      return hasUserDoc() ? signedInUserDoc().data.role : "viewer";
    }

    function role() {
      return rawRole() in ["host", "teacher", "student", "viewer"] ? rawRole() : "viewer";
    }

    function approvalStatus() {
      return hasUserDoc() ? signedInUserDoc().data.approvalStatus : "pending";
    }

    function accountStatus() {
      return hasUserDoc() ? signedInUserDoc().data.status : "deactive";
    }

    function isApproved() {
      return approvalStatus() == "approved";
    }

    function isActiveOrHost() {
      return role() == "host" || accountStatus() == "active";
    }

    function hasActiveProfile() {
      return hasUserDoc() && isApproved() && isActiveOrHost();
    }

    function isHost() {
      return hasActiveProfile() && role() == "host";
    }

    function isTeacher() {
      return hasActiveProfile() && role() == "teacher";
    }

    function isStudent() {
      return hasActiveProfile() && role() == "student";
    }

    function isViewerEffective() {
      return hasUserDoc() && (!isApproved() || !isActiveOrHost() || role() == "viewer");
    }

    function validString(value, max) {
      return value is string && value.size() <= max;
    }

    function validOptionalString(data, field, max) {
      return !(field in data) || validString(data[field], max);
    }

    function validEmail(value) {
      return value is string
        && value.size() <= 254
        && value.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }

    function validRole(value) {
      return value in ["host", "teacher", "student", "viewer"];
    }

    function validAccountStatus(value) {
      return value in ["active", "deactive"];
    }

    function validApprovalStatus(value) {
      return value in ["pending", "approved", "rejected"];
    }

    function validUser(data) {
      return data.keys().hasOnly([
          "uid", "email", "displayName", "role", "status", "approvalStatus",
          "teacherUid", "studentId", "createdAt", "updatedAt", "approvedAt", "approvedBy"
        ])
        && data.uid is string
        && data.uid.size() > 0
        && validEmail(data.email)
        && validString(data.displayName, 100)
        && validRole(data.role)
        && validAccountStatus(data.status)
        && validApprovalStatus(data.approvalStatus)
        && validOptionalString(data, "teacherUid", 128)
        && validOptionalString(data, "studentId", 64)
        && data.createdAt is timestamp
        && data.updatedAt is timestamp;
    }

    function teacherApplicationOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    function validTeacherApplication(data, uid) {
      return data.keys().hasOnly([
          "uid", "email", "displayName", "phone", "note", "status",
          "createdAt", "reviewedAt", "reviewedBy", "rejectReason"
        ])
        && data.uid == uid
        && validEmail(data.email)
        && validString(data.displayName, 100)
        && validOptionalString(data, "phone", 20)
        && validOptionalString(data, "note", 500)
        && data.status in ["pending", "approved", "rejected"]
        && data.createdAt is timestamp;
    }

    function validStudentProfile(profile) {
      return profile is map
        && profile.keys().hasOnly(["hoTen", "loaiBang", "soDienThoai", "tenZalo", "cccd", "ghiChu"])
        && validString(profile.hoTen, 100)
        && validString(profile.loaiBang, 40)
        && validOptionalString(profile, "soDienThoai", 20)
        && validOptionalString(profile, "tenZalo", 100)
        && validOptionalString(profile, "cccd", 20)
        && validOptionalString(profile, "ghiChu", 500);
    }

    function validStudentApplication(data, uid) {
      return data.keys().hasOnly([
          "uid", "email", "displayName", "teacherUid", "studentProfile", "status",
          "createdAt", "reviewedAt", "reviewedBy", "rejectReason"
        ])
        && data.uid == uid
        && validEmail(data.email)
        && validString(data.displayName, 100)
        && data.teacherUid is string
        && data.teacherUid.size() > 0
        && validStudentProfile(data.studentProfile)
        && data.status in ["pending", "approved", "rejected"]
        && data.createdAt is timestamp;
    }

    function validStudent(data) {
      return data.keys().hasOnly([
          "id", "ten", "sdt", "tenZalo", "cccd", "loaiBang",
          "tongHocPhi", "daNop", "conThieu", "daHocLyThuyet",
          "soKmDAT", "daHocSaHinh", "teacherUid", "studentUserUid",
          "createdAt", "updatedAt"
        ])
        && data.id is string
        && validString(data.ten, 100)
        && validString(data.sdt, 20)
        && validString(data.tenZalo, 100)
        && validString(data.cccd, 20)
        && validString(data.loaiBang, 40)
        && data.tongHocPhi is number
        && data.tongHocPhi >= 0
        && data.daNop is number
        && data.daNop >= 0
        && data.conThieu is number
        && data.conThieu >= 0
        && data.daHocLyThuyet is bool
        && data.soKmDAT is number
        && data.soKmDAT >= 0
        && data.daHocSaHinh is bool
        && data.teacherUid is string
        && validOptionalString(data, "studentUserUid", 128);
    }

    function teacherOwnsStudent(data) {
      return isTeacher() && data.teacherUid == request.auth.uid;
    }

    function studentOwnsStudent(data) {
      return isStudent() && data.studentUserUid == request.auth.uid;
    }

    function studentOnlyUpdatesDatKm() {
      return request.resource.data.diff(resource.data).changedKeys().hasOnly(["soKmDAT", "updatedAt"])
        && request.resource.data.soKmDAT is number
        && request.resource.data.soKmDAT >= 0
        && request.resource.data.teacherUid == resource.data.teacherUid
        && request.resource.data.studentUserUid == resource.data.studentUserUid;
    }

    function validSchedule(data) {
      return data.keys().hasOnly([
          "id", "studentId", "studentName", "studentPhone", "studentZaloName",
          "licenseType", "date", "slotKey", "slotLabel", "startTime", "endTime",
          "time", "note", "meetingLocation", "meetingLocationStatus",
          "teacherReminderNote", "teacherConfirmed", "reminderCreatedAt",
          "reminderUpdatedAt", "meetingNote", "notificationStatus", "notifiedAt",
          "datCreatedNotificationSentAt", "createdAt", "updatedAt",
          "teacherUid", "studentUserUid", "createdByUid"
        ])
        && data.id is string
        && validString(data.studentId, 64)
        && validString(data.studentName, 100)
        && validOptionalString(data, "studentPhone", 20)
        && validOptionalString(data, "studentZaloName", 100)
        && validString(data.licenseType, 40)
        && validString(data.date, 20)
        && validString(data.slotKey, 40)
        && validString(data.slotLabel, 40)
        && validString(data.startTime, 10)
        && validString(data.endTime, 10)
        && validString(data.time, 30)
        && validOptionalString(data, "note", 500)
        && validOptionalString(data, "meetingLocation", 500)
        && data.meetingLocationStatus in ["pending", "confirmed", "cancelled"]
        && validOptionalString(data, "teacherReminderNote", 500)
        && data.teacherConfirmed is bool
        && validOptionalString(data, "meetingNote", 500)
        && data.notificationStatus in ["pending", "ready", "sent"]
        && data.teacherUid is string
        && validOptionalString(data, "studentUserUid", 128)
        && data.createdByUid is string;
    }

    function teacherOwnsSchedule(data) {
      return isTeacher() && data.teacherUid == request.auth.uid;
    }

    function studentOwnsSchedule(data) {
      return isStudent() && data.studentUserUid == request.auth.uid;
    }

    function validNotificationToken(data) {
      return data.keys().hasOnly([
          "uid", "email", "displayName", "role", "effectiveRole", "token",
          "platform", "userAgent", "enabled", "createdAt", "updatedAt"
        ])
        && data.uid == request.auth.uid
        && validOptionalString(data, "email", 254)
        && validOptionalString(data, "displayName", 100)
        && validRole(data.role)
        && validRole(data.effectiveRole)
        && validString(data.token, 4096)
        && validString(data.platform, 40)
        && validOptionalString(data, "userAgent", 500)
        && data.enabled is bool;
    }

    match /users/{uid} {
      allow read: if isSignedIn() && request.auth.uid == uid;
      allow create, update: if isHost() && validUser(request.resource.data);
      allow delete: if false;
    }

    match /teacherApplications/{uid} {
      allow create: if teacherApplicationOwner(uid)
        && !hasUserDoc()
        && validTeacherApplication(request.resource.data, uid)
        && request.resource.data.status == "pending";

      allow read: if teacherApplicationOwner(uid) || isHost();

      allow update: if isHost()
        && validTeacherApplication(request.resource.data, uid)
        && resource.data.status == "pending"
        && request.resource.data.status in ["approved", "rejected"];

      allow delete: if false;
    }

    match /studentApplications/{uid} {
      allow create: if teacherApplicationOwner(uid)
        && !hasUserDoc()
        && validStudentApplication(request.resource.data, uid)
        && request.resource.data.status == "pending";

      allow read: if teacherApplicationOwner(uid)
        || isHost()
        || (isTeacher() && resource.data.teacherUid == request.auth.uid);

      allow update: if isTeacher()
        && resource.data.teacherUid == request.auth.uid
        && validStudentApplication(request.resource.data, uid)
        && resource.data.status == "pending"
        && request.resource.data.status in ["approved", "rejected"];

      allow delete: if false;
    }

    match /students/{studentId} {
      allow read: if isHost()
        || teacherOwnsStudent(resource.data)
        || studentOwnsStudent(resource.data)
        || isViewerEffective();

      allow create: if isTeacher()
        && validStudent(request.resource.data)
        && request.resource.data.teacherUid == request.auth.uid;

      allow update: if (
          isTeacher()
          && resource.data.teacherUid == request.auth.uid
          && request.resource.data.teacherUid == resource.data.teacherUid
          && validStudent(request.resource.data)
        ) || (
          studentOwnsStudent(resource.data)
          && studentOnlyUpdatesDatKm()
        );

      allow delete: if isTeacher()
        && resource.data.teacherUid == request.auth.uid;
    }

    match /schedules/{scheduleId} {
      allow read: if isHost()
        || teacherOwnsSchedule(resource.data)
        || studentOwnsSchedule(resource.data);

      allow create: if validSchedule(request.resource.data)
        && (
          (isTeacher() && request.resource.data.teacherUid == request.auth.uid)
          || (isStudent() && request.resource.data.studentUserUid == request.auth.uid)
        );

      allow update: if isTeacher()
        && resource.data.teacherUid == request.auth.uid
        && request.resource.data.teacherUid == resource.data.teacherUid
        && validSchedule(request.resource.data);

      allow delete: if isTeacher()
        && resource.data.teacherUid == request.auth.uid;
    }

    match /notificationTokens/{tokenId} {
      allow create: if hasActiveProfile()
        && validNotificationToken(request.resource.data)
        && request.resource.data.uid == request.auth.uid;

      allow read: if hasActiveProfile()
        && (resource.data.uid == request.auth.uid || isHost());

      allow update: if hasActiveProfile()
        && resource.data.uid == request.auth.uid
        && validNotificationToken(request.resource.data)
        && request.resource.data.uid == resource.data.uid;

      allow delete: if hasActiveProfile()
        && resource.data.uid == request.auth.uid;
    }

    match /auditLogs/{logId} {
      allow read: if isHost();
      allow create: if isHost() || isTeacher();
      allow update, delete: if false;
    }
  }
}
```

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for the proposed role model because they default to authenticated access, prevent users from creating their own active privileged `users/{uid}` profile, scope teacher/student writes by `teacherUid` and `studentUserUid`, and validate document fields on writes. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.

## 6. `firestore.indexes.json` đề xuất

```json
{
  "indexes": [
    {
      "collectionGroup": "teacherApplications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "studentApplications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "teacherUid", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "students",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "teacherUid", "order": "ASCENDING" },
        { "fieldPath": "ten", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "schedules",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "teacherUid", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "schedules",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentUserUid", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## 7. Code query frontend cần tương ứng

Teacher đọc học viên của mình:

```js
query(
  collection(firestore, "students"),
  where("teacherUid", "==", session.uid),
  orderBy("ten", "asc"),
);
```

Student đọc hồ sơ của mình:

```js
query(
  collection(firestore, "students"),
  where("studentUserUid", "==", session.uid),
);
```

Teacher đọc học sinh chờ duyệt:

```js
query(
  collection(firestore, "studentApplications"),
  where("teacherUid", "==", session.uid),
  where("status", "==", "pending"),
  orderBy("createdAt", "asc"),
);
```

Host đọc giáo viên chờ duyệt:

```js
query(
  collection(firestore, "teacherApplications"),
  where("status", "==", "pending"),
  orderBy("createdAt", "asc"),
);
```

## 8. Lệnh deploy sau khi review

Chỉ chạy sau khi đã copy prototype vào file thật và review:

```bash
npx -y firebase-tools@latest deploy --only firestore:rules
npx -y firebase-tools@latest deploy --only firestore:indexes
```

