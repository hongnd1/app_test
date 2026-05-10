# `src/logic/student/studentRepository.js`

## Vai trò

Repository cho collection `students`, dùng `createCollectionStore`.

## API

- `getAll()`
- `save(student)`
- `remove(studentId)`

## Task cần cập nhật

- Khi áp dụng `teacherUid`, repository không nên luôn đọc toàn bộ collection cho teacher/student.
- Cần query theo phạm vi quyền và dựa vào Firestore Rules.
- Xóa học viên chỉ dành cho `teacher` có quyền và đúng phạm vi.

