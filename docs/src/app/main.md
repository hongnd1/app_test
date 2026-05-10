# `src/app/main.js`

## Vai trò

Entry point của app. File này giữ state runtime, subscribe auth, tải dữ liệu dashboard, nối service nghiệp vụ với UI và truyền handler xuống `DashboardScreen`/`LoginScreen`.

## Trách nhiệm chính

- Khởi tạo state: session, students, schedules, notifications, bộ lọc và trạng thái UI.
- Tính permission hiện tại qua `state.session.permissions`.
- Điều phối login/logout với `firebaseAuthService`.
- Tải students/schedules từ service.
- Chạy reminder và notification runtime theo session.
- Xử lý CRUD học viên, lịch DAT, địa điểm hẹn.
- Render loading, error, login hoặc dashboard.

## Task liên quan phân quyền

- Dùng `hasPermission(permissionKey)` làm điểm kiểm tra quyền trong handler.
- Khi áp dụng role mới, `defaultPermissions` cần đồng bộ với bảng permission mới.
- Các handler ghi dữ liệu phải kiểm tra permission trước khi gọi service.
- Khi session có `effectiveRole = viewer`, UI vẫn có thể đọc dữ liệu cơ bản nhưng không được gọi action ghi.

## Task liên quan đăng nhập

- Subscribe auth hiện đang nhận `{ session, error }`.
- Luồng mới nên mở rộng state auth thành `checking`, `needOnboarding`, `pendingTeacherApproval`, `pendingStudentApproval`, `rejected`, `ready`.
- `render()` cần route tới các màn onboarding/chờ duyệt trước khi vào dashboard.

## Cap nhat gop y, thong bao, thong ke

- `main.js` noi `feedbackService` de teacher/student gui gop y va host xem `feedbackReports`.
- Host co the danh dau van de app da xu ly.
- Notification center co handler xoa tung thong bao local.
- Tab `Thong ke` dung `progressService.getTeachingStatistics`; host co them danh sach giao vien da duyet de loc.
- Permission moi can giu dong bo: `canSubmitFeedback`, `canViewFeedbackReports`, `canViewStatistics`.
