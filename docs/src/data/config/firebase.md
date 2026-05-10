# `src/data/config/firebase.js`

## Vai trò

Khởi tạo Firebase app, Authentication, Firestore và Analytics nếu chạy được trên môi trường hiện tại.

## Trách nhiệm chính

- Lưu `firebaseConfig`.
- Export `firebaseApp`, `auth`, `firestore`.
- Thử khởi tạo `analytics`, nhưng không làm app lỗi nếu analytics không khả dụng.

## Task cần lưu ý

- Không đặt secret trong file này; config Firebase web không phải secret nhưng vẫn cần quản lý theo môi trường khi deploy thật.
- Khi thêm Firestore collection mới như `teacherApplications`, `studentApplications`, `auditLogs`, các service có thể import `firestore` từ đây.

