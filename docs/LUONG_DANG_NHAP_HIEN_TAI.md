# Luồng Đăng Nhập Hiện Tại

## Mục tiêu

Tài liệu này mô tả đúng luồng đăng nhập hiện đang chạy trong app, để sau này chỉnh Firebase Auth, Firestore Rules hoặc UI mà không lệch logic thực tế.

## 1. Các phương thức đăng nhập đang hỗ trợ

App hiện hỗ trợ 2 cách đăng nhập:

- `Email / Password`
- `Google Sign-In`

Cả hai đều đi qua Firebase Authentication.

## 2. Điểm vào chính

Luồng đăng nhập hiện nằm tại:

- [src/ui/screens/LoginScreen.js](/d:/Tools/app_blx/src/ui/screens/LoginScreen.js)
- [src/logic/auth/firebaseAuthService.js](/d:/Tools/app_blx/src/logic/auth/firebaseAuthService.js)
- [src/app/main.js](/d:/Tools/app_blx/src/app/main.js)

## 3. Luồng đăng nhập email/password

1. Người dùng nhập email và mật khẩu ở màn hình login.
2. `LoginScreen` gọi `onLogin(...)`.
3. `main.js` gọi `firebaseAuthService.login(credentials)`.
4. `firebaseAuthService` kiểm tra dữ liệu bằng `authValidator`.
5. Nếu hợp lệ, app gọi `signInWithEmailAndPassword(...)`.
6. Nếu Firebase Auth thành công, app tiếp tục kiểm tra quyền bằng cách đọc Firestore document `users/{uid}`.
7. Chỉ khi đọc được `users/{uid}`, app mới coi là đăng nhập thành công hoàn toàn.

## 4. Luồng đăng nhập Google

1. Người dùng bấm `Đăng nhập với Google`.
2. `LoginScreen` gọi `onLoginWithGoogle()`.
3. `main.js` gọi `firebaseAuthService.loginWithGoogle()`.
4. `firebaseAuthService` gọi `signInWithPopup(auth, googleProvider)`.
5. Sau khi popup Google xác thực xong, app tiếp tục kiểm tra Firestore document `users/{uid}`.
6. Nếu `users/{uid}` không tồn tại hoặc không đọc được, app sẽ tự `signOut()` lại và trả thông báo lỗi ra màn hình login.

## 5. Điều kiện để đăng nhập thành công hoàn toàn

Một user chỉ được vào app nếu đồng thời thỏa cả 2 điều kiện:

1. Firebase Authentication đăng nhập thành công
2. Firestore có document `users/{uid}` đọc được

Điều này áp dụng cho cả:

- user email/password
- user Google

## 6. Vai trò của `users/{uid}`

Document `users/{uid}` hiện dùng để lấy:

- `displayName`
- `role`

Ví dụ:

```json
{
  "displayName": "Nguyễn Văn A",
  "role": "admin"
}
```

Nếu thiếu document này, app không cho vào hệ thống.

## 7. Auth state trong app

App dùng `onAuthStateChanged(...)` để theo dõi phiên đăng nhập.

Khi Firebase Auth đổi trạng thái:

- nếu chưa có user: app ở màn hình login
- nếu có user và đọc được `users/{uid}`: app vào dashboard
- nếu có user nhưng đọc `users/{uid}` lỗi: app quay về login và hiện lỗi

## 8. Các lỗi đăng nhập đã xử lý riêng

App hiện có thông báo riêng cho các trường hợp:

- email sai định dạng
- thiếu mật khẩu
- email/mật khẩu sai
- popup Google bị đóng
- popup Google bị chặn
- Google provider chưa bật
- domain chưa nằm trong `Authorized domains`
- thiếu `users/{uid}`
- Firestore từ chối đọc hồ sơ quyền

Nếu lỗi không nằm trong danh sách map sẵn, app sẽ hiện thêm:

- `error.code`
- `error.message`

để dễ debug.

## 9. Điều kiện Firebase cần có

### Với email/password

- Bật `Email/Password` trong Firebase Authentication

### Với Google

- Bật `Google` trong Firebase Authentication
- Domain đang chạy app phải nằm trong `Authorized domains`

## 10. Điều kiện Firestore cần có

Rules hiện tại phải cho phép user đã đăng nhập đọc đúng document:

- `users/{uid}` với `uid` chính là `request.auth.uid`

Nếu rule chặn đọc document này, app sẽ không vào được dashboard.

## 11. Hành vi khi user chưa có phân quyền

Nếu user đăng nhập Firebase Auth thành công nhưng chưa có `users/{uid}`, app hiện thông báo:

`Tài khoản của bạn chưa được cấp quyền đăng nhập. Vui lòng liên hệ thầy giáo hoặc admin để được cấp quyền truy cập.`

## 12. Ghi chú kỹ thuật quan trọng

- App không dùng `accounts.js` cũ nữa trong luồng chính
- App không hard-code tài khoản để đăng nhập
- Session thật hiện nay đến từ Firebase Authentication + Firestore `users/{uid}`
- Phân quyền giao diện và thao tác trong app đều dựa trên `role` đã đọc từ `users/{uid}`
