# `src/data/firebase/collectionStore.js`

## Vai trò

Store Firestore tổng quát cho collection có khóa document là `item.id`.

## Trách nhiệm chính

- Seed dữ liệu mock vào collection nếu collection đang rỗng.
- `getAll()`: đọc toàn bộ documents.
- `save(item)`: ghi document theo `item.id`.
- `remove(id)`: xóa document theo id.

## Task cần lưu ý

- Store này phù hợp với collection đơn giản như `students`, `schedules`.
- Với dữ liệu phân quyền mới, các collection như `users`, `teacherApplications`, `studentApplications` cần repository riêng vì document id là `uid` và cần rules/transaction rõ hơn.
- Seed chỉ nên dùng cho môi trường dev/demo, không dùng để tạo dữ liệu thật ngoài ý muốn.

