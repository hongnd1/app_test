# Phân Quyền Hiện Tại

## Mục tiêu

Tài liệu này ghi lại đúng phân quyền hiện đang chạy trong app, gồm:

- role nào đang tồn tại
- mỗi role có quyền gì
- giao diện hiển thị khác nhau như thế nào
- thao tác nào bị khóa trong app

## 1. Nguồn phân quyền

Phân quyền hiện lấy từ:

- Firestore document `users/{uid}`
- field `role`

File chính:

- [src/logic/auth/firebaseAuthService.js](/d:/Tools/app_blx/src/logic/auth/firebaseAuthService.js)

## 2. Các role hiện có

App hiện đang có 4 role:

- `host`
- `admin`
- `staff`
- `viewer`

## 3. Tổng quan quyền theo role

### `host`

Mục đích:

- quản lý mode thông báo trên thiết bị hiện tại

Quyền hiện có:

- bật thông báo
- đổi `notification mode`

Không có quyền:

- tạo học viên
- sửa học viên
- sửa km DAT
- xóa học viên
- tạo lịch
- xóa lịch
- cập nhật địa điểm hẹn

Hiển thị trên app:

- vào được app nếu có `users/{uid}`
- thấy tab `Cài đặt`
- thấy phần đổi `notification mode`
- thấy chuông thông báo
- không có quyền thao tác nghiệp vụ chính

### `admin`

Mục đích:

- role quản trị nghiệp vụ chính

Quyền hiện có:

- tạo học viên
- sửa toàn bộ thông tin học viên
- sửa km DAT
- xóa học viên
- xem thông tin nhạy cảm học viên
- tạo lịch DAT
- xóa lịch DAT
- cập nhật địa điểm hẹn
- bật thông báo

Không có quyền:

- đổi `notification mode` trong UI, trừ khi role là `host`

Hiển thị trên app:

- thấy đầy đủ các tab
- thấy đầy đủ chi tiết học viên
- thấy nút thêm học viên
- thấy nút đặt lịch DAT
- thấy nút xóa lịch
- thấy nút cập nhật địa điểm hẹn
- thấy chuông thông báo
- thấy phần bật thông báo trong `Cài đặt`

### `staff`

Mục đích:

- nhân sự vận hành lịch học DAT

Quyền hiện có:

- sửa `soKmDAT`
- tạo lịch DAT
- bật thông báo

Không có quyền:

- tạo học viên mới
- sửa toàn bộ hồ sơ học viên
- xóa học viên
- xem thông tin nhạy cảm
- xóa lịch
- cập nhật địa điểm hẹn
- đổi `notification mode`

Hiển thị trên app:

- thấy chuông thông báo
- thấy tab `Cài đặt`
- thấy nút bật thông báo
- thấy danh sách học viên
- khi mở chi tiết học viên chỉ thấy:
  - tên học viên
  - loại bằng
  - km DAT
- không thấy CCCD
- không thấy số điện thoại
- không thấy tên Zalo
- có thể mở form cập nhật km DAT
- có thể tạo lịch DAT
- không thấy nút địa điểm hẹn
- không thấy nút xóa lịch

### `viewer`

Mục đích:

- chỉ xem dữ liệu cơ bản, không thao tác

Quyền hiện có:

- đăng nhập vào app nếu có `users/{uid}`
- xem dữ liệu theo phạm vi UI hiện cho phép

Không có quyền:

- tạo học viên
- sửa học viên
- sửa km DAT
- xóa học viên
- tạo lịch
- xóa lịch
- cập nhật địa điểm hẹn
- bật thông báo
- đổi `notification mode`

Hiển thị trên app:

- không thấy nút bật thông báo
- không thấy quyền thao tác nghiệp vụ
- không thấy các nút thêm/sửa/xóa
- chuông thông báo không hoạt động theo luồng notification role

## 4. Quyền nội bộ đang dùng trong code

App hiện quy đổi role thành các permission nội bộ sau:

- `canCreateStudent`
- `canEditStudent`
- `canEditStudentDat`
- `canDeleteStudent`
- `canViewSensitiveStudentInfo`
- `canCreateSchedule`
- `canDeleteSchedule`
- `canAssignMeetingLocation`
- `canEnablePushNotifications`
- `canSetNotificationMode`

## 5. UI hiện tại bị chi phối bởi quyền như thế nào

### Phần học viên

#### Nếu có `canCreateStudent`

- thấy nút `Thêm học viên`

#### Nếu có `canEditStudent`

- sửa được toàn bộ hồ sơ học viên

#### Nếu chỉ có `canEditStudentDat`

- chỉ được cập nhật `soKmDAT`

#### Nếu có `canViewSensitiveStudentInfo`

- chi tiết học viên hiển thị đầy đủ:
  - mã học viên
  - số điện thoại
  - tên Zalo
  - CCCD
  - loại bằng
  - học phí
  - km DAT

#### Nếu không có `canViewSensitiveStudentInfo`

- chi tiết học viên chỉ hiển thị:
  - tên học viên
  - loại bằng
  - km DAT

### Phần lịch DAT

#### Nếu có `canCreateSchedule`

- được mở form tạo lịch DAT

#### Nếu có `canDeleteSchedule`

- thấy nút xóa lịch

#### Nếu có `canAssignMeetingLocation`

- thấy nút cập nhật địa điểm hẹn
- có thể xử lý các lịch DAT đang `pending`

### Phần thông báo

#### Nếu có `canEnablePushNotifications`

- thấy chuông thông báo
- thấy phần bật thông báo trong tab `Cài đặt`

#### Nếu có `canSetNotificationMode`

- thấy select đổi `notification mode` trong tab `Cài đặt`

## 6. Quan hệ giữa role và Firestore rules hiện tại

Rules hiện tại đang bám chủ yếu vào:

- `admin`
- `staff`
- `viewer` mặc định nếu không có role

Hiện tại `host` là role giao diện để điều khiển mode thông báo, nhưng chưa phải role nghiệp vụ backend riêng trong rules.

Nghĩa là:

- nếu muốn `host` có thêm quyền backend thật, cần cập nhật Firestore rules tương ứng

## 7. Trạng thái hiện tại của rules

Theo [firestore.rules](/d:/Tools/app_blx/firestore.rules):

- `admin`:
  - đọc toàn bộ app data
  - tạo/sửa/xóa học viên
  - tạo/sửa/xóa lịch

- `staff`:
  - đọc toàn bộ app data
  - chỉ sửa `soKmDAT` trên học viên
  - tạo lịch
  - không sửa/xóa lịch

- `viewer`:
  - đọc dữ liệu nếu có `users/{uid}`
  - không có quyền ghi

## 8. Kết luận vận hành

Nếu cần giữ hệ thống đơn giản, hiện có thể hiểu ngắn như sau:

- `admin`: toàn quyền nghiệp vụ
- `staff`: vận hành DAT ở mức giới hạn
- `viewer`: chỉ xem
- `host`: điều khiển mode thông báo ở UI, không phải toàn quyền backend

Nếu sau này đổi rules, nên cập nhật lại tài liệu này trước hoặc đồng thời với code để tránh lệch giữa:

- role trong UI
- role trong Firestore Rules
- role trong tài liệu vận hành
