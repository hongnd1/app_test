# Mô tả ứng dụng quản lý học sinh

## 1. Tổng quan
Ứng dụng được xây dựng để hỗ trợ quản lý học sinh trong quá trình học, theo dõi tiến độ đào tạo, tình trạng nộp học phí, hạng bằng đang theo học và lịch chạy DAT đã đặt trước.

Mục tiêu của ứng dụng là giúp người quản lý dễ dàng:
- Lưu trữ thông tin học sinh
- Theo dõi tình trạng nộp tiền
- Theo dõi tiến độ học tập của từng học sinh
- Lọc và tìm kiếm học sinh theo nhiều tiêu chí
- Quản lý tài khoản đăng nhập theo thời hạn sử dụng
- Theo dõi học viên theo hạng bằng
- Đặt và theo dõi lịch học DAT
- Hiển thị lời chào phù hợp với lớp học của Thầy Tuấn Anh

---

## 2. Cấu trúc giao diện chính
Ứng dụng được tách thành 3 tab chính và **thanh tab nằm ngang ở phía dưới màn hình**:
- **Tiến độ**
- **Lịch học**
- **Học viên**

Tab bar cần hiển thị theo hàng ngang từ trái sang phải để thao tác nhanh trên điện thoại.

---

## 3. Tab Tiến độ học viên
Tab này hiển thị các thanh bar tiến độ học viên theo từng phần:
- Tổng số học viên
- Đã hoàn thành lý thuyết
- Đã học sa hình
- Đã đạt DAT
- Đã hoàn tất học phí

Yêu cầu hành vi:
- Khi bấm vào **Tổng số học viên** thì **không filter**, chỉ chuyển sang tab **Danh sách học viên**
- Khi bấm vào một thanh tiến độ khác thì hệ thống sẽ chuyển sang tab **Danh sách học viên** và lọc đúng nhóm học viên tương ứng

---

## 4. Tab Lịch học
Tab này dùng để quản lý lịch chạy DAT của học viên.

### 4.1. Vùng hiển thị nhanh
- **Phần 1**: Lịch học hôm nay
- **Phần 2**: Lịch học ngày mai
- Hai vùng này phải hiển thị rõ **thứ** và **ngày cụ thể**

### 4.2. Lịch tổng hợp theo tháng
- Phần **Tất cả** cần hiển thị dạng **lịch tháng** giống giao diện lịch trên điện thoại
- Người dùng có thể bấm vào từng ngày trong lịch tháng
- Khi bấm vào ngày nào thì có thể xem lịch của ngày đó và thêm lịch DAT cho ngày đó

### 4.3. Chức năng đặt lịch DAT
- Chỉ cho phép đặt lịch DAT cho học viên đã hoàn thành lý thuyết
- Có thể thêm học viên vào ngày đang được chọn trên lịch
- Khi bấm vào ngày nào cũng phải có nút **Thêm lịch học**
- Mỗi lịch DAT là một **khoảng thời gian**, ví dụ `06:00 - 09:00`
- Nếu trùng khoảng giờ trong cùng ngày thì phải cảnh báo
- Giờ học chỉ được phép trong khoảng **06:00 - 21:00**

---

## 5. Tab Danh sách học viên
Tab này có các chức năng:
- Lọc học viên
- Tìm kiếm học viên
- Thêm học viên
- Xem chi tiết, sửa, xóa học viên
- Đặt lịch DAT nếu học viên đã hoàn thành lý thuyết

### 5.1. Yêu cầu phần tìm kiếm
- Bình thường phần filter **không hiển thị**
- Có nút **Tìm kiếm học viên** nằm cạnh nút **Thêm học sinh**
- Khi bấm vào nút này thì mới mở toàn bộ vùng filter
- Không được mất focus khi đang gõ trên điện thoại hoặc trình duyệt
- Bình thường khi chưa mở chi tiết, danh sách chỉ hiển thị ngắn gọn:
  - **Tên học viên**
  - **Hạng bằng**
- Sau khi bấm vào học viên thì mới hiển thị chi tiết và các chức năng:
  - **Đặt lịch DAT**
  - **Xóa**
  - **Sửa thông tin**

---

## 6. Thông tin học sinh cần quản lý
- Tên học sinh
- Số CCCD
- Loại bằng
- Tổng học phí
- Số tiền đã nộp
- Số tiền còn thiếu
- Đã học lý thuyết hay chưa
- Đã học sa hình hay chưa
- Số km DAT

Các loại bằng hỗ trợ:
- A1
- A2
- B tự động
- B số sàn
- C1
- D
- E

---

## 7. Dữ liệu lịch học DAT
Mỗi lịch học DAT cần có:
- Mã lịch
- Học viên
- Hạng bằng
- Ngày học
- Giờ học
- Ghi chú

---

## 8. Tối ưu cho điện thoại 6.5 - 7 inch
- Giao diện phải ưu tiên hiển thị tốt trên màn hình điện thoại cỡ 6.5 đến 7 inch
- Tab bar phía dưới phải dễ bấm bằng ngón tay cái
- Các vùng lịch và danh sách phải gọn, không hiển thị thừa thông tin
- Kết quả tìm kiếm phải tối giản để người dùng chọn nhanh
- Các thao tác chuyển tab, lọc và đặt lịch phải thực hiện được trên một màn hình nhỏ mà không gây rối
- Các vùng tiêu đề chính phải bo tròn đồng bộ với các khối nội dung khác

---

## 9. Luồng sử dụng cơ bản
1. Người dùng mở ứng dụng
2. Đăng nhập bằng tài khoản hợp lệ đã được cấu hình trong file riêng
3. Xem tab Tiến độ để nắm tổng quan học viên
4. Bấm vào một thanh tiến độ để chuyển sang tab Học viên đã lọc
5. Tìm kiếm học viên nhanh theo tên hoặc CCCD
6. Chọn học viên để xem chi tiết hoặc đặt lịch DAT
7. Mở tab Lịch học để xem lịch hôm nay, ngày mai hoặc lịch tháng tổng hợp
8. Chọn ngày trong lịch tháng để thêm lịch DAT cho ngày đó

---

## 10. Ghi chú cập nhật
- Sau mỗi lần sửa, tài liệu mô tả phải được cập nhật đồng thời.
- Sau mỗi lần sửa, cần commit và push ngay để có thể kiểm tra trên điện thoại.
- Nếu có lỗi mất focus khi tìm kiếm hoặc lỗi giao diện trắng, cần ưu tiên kiểm tra luồng render của tab và component tìm kiếm.
- Màn hình đăng nhập không hiển thị sẵn tên tài khoản và mật khẩu mẫu.
- Màn hình chào hiển thị nội dung giới thiệu lớp học của Thầy Tuấn Anh.
- Topbar hiển thị dạng `Xin chào ...` và có dòng bản quyền thiết kế bởi Nguyễn Đình Hồng.
- Nút `Đăng xuất` phải hiển thị rõ chữ và có màu đỏ nổi bật để dễ nhận biết.


