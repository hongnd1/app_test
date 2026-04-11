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

---

## 2. Thông tin học sinh cần quản lý
Mỗi học sinh sẽ có các trường thông tin chính như sau:

### 2.1. Thông tin cơ bản
- **Tên học sinh**
- **Số CCCD**
- **Loại bằng**

Các loại bằng hỗ trợ:
- **A1**
- **A2**
- **B tự động**
- **B số sàn**
- **C1**
- **D**
- **E**

### 2.2. Thông tin tài chính
- **Tổng số tiền cần nộp**
- **Số tiền đã nộp**
- **Số tiền còn thiếu**

### 2.3. Thông tin tiến độ học
- **Đã học xong lý thuyết hay chưa**
- **Đã chạy DAT được bao nhiêu km**
- **Đã học sa hình hay chưa**

### 2.4. Lịch học DAT
- **Ngày học DAT**
- **Giờ học DAT**
- **Ghi chú buổi học**
- **Học viên tham gia buổi DAT**

---

## 3. Cấu trúc màn hình chính theo tab
Ứng dụng được tách thành 3 tab chính:

### 3.1. Tab Tiến độ học viên
- Hiển thị các thanh bar tiến độ học viên theo từng phần
- Bao gồm các nhóm như:
  - Đã hoàn thành lý thuyết
  - Đã học sa hình
  - Đã đạt DAT
  - Đã hoàn tất học phí
- Khi bấm vào một mục bất kỳ, hệ thống sẽ **chuyển sang tab Danh sách học viên**
- Đồng thời tự động áp bộ lọc để chỉ hiển thị đúng nhóm học viên thuộc mục đó

### 3.2. Tab Lịch học
- Dùng để quản lý lịch học chạy DAT của học viên
- Người dùng có thể đặt lịch DAT và thêm học viên vào lịch
- Chỉ cho phép đặt lịch DAT khi học viên **đã hoàn thành lý thuyết**
- Tab này gồm 3 vùng chính:
  - **Vùng 1**: lịch học ngày hôm nay
  - **Vùng 2**: lịch học ngày mai
  - **Vùng 3**: tab hiển thị lịch tổng hợp để xem toàn bộ hoặc lọc theo hôm nay/ngày mai

### 3.3. Tab Danh sách học viên
- Có chức năng lọc học viên
- Có chức năng thêm học viên
- Có thể xem chi tiết, sửa, xóa học viên
- Khi tra cứu học viên, nếu học viên đã hoàn thành lý thuyết thì sẽ có thêm chức năng **Đặt lịch DAT** ngay trong danh sách

---

## 4. Chức năng chính

### 4.1. Quản lý danh sách học sinh
- Thêm học sinh mới
- Sửa thông tin học sinh
- Xóa học sinh
- Xem chi tiết từng học sinh

### 4.2. Quản lý tài chính
- Cập nhật số tiền học sinh đã nộp
- Tự động tính số tiền còn thiếu
- Hiển thị nhanh trạng thái thanh toán của từng học sinh

Ví dụ:
- Tổng học phí: 10.000.000 VNĐ
- Đã nộp: 6.000.000 VNĐ
- Còn thiếu: 4.000.000 VNĐ

### 4.3. Quản lý tiến độ học tập
- Đánh dấu học sinh đã hoàn thành phần lý thuyết
- Nhập số km DAT đã chạy
- Đánh dấu học sinh đã học sa hình hay chưa
- Hỗ trợ theo dõi tổng quan để biết học sinh đang ở giai đoạn nào

### 4.4. Tìm kiếm và lọc dữ liệu
Ứng dụng cần có chức năng lọc học sinh theo các tiêu chí như:
- Những người **đã học lý thuyết**
- Những người **chưa học lý thuyết**
- Những người **đã nộp một mức tiền nhất định**
- Những người **còn thiếu tiền**
- Những người **đã học sa hình**
- Những người **chưa học sa hình**
- Những người có **số km DAT đạt hoặc chưa đạt mức yêu cầu**
- Những người theo **loại bằng cụ thể**

Ngoài ra có thể có ô tìm kiếm nhanh theo:
- Tên
- Số CCCD

### 4.5. Quản lý lịch học DAT
- Tạo lịch học DAT mới
- Chọn học viên đủ điều kiện để xếp lịch
- Xem lịch hôm nay, ngày mai và toàn bộ lịch
- Xóa lịch đã tạo khi cần điều chỉnh

---

## 5. Màn hình đăng nhập
Ứng dụng có **màn hình đăng nhập** để người dùng truy cập hệ thống.

### 5.1. Chức năng đăng nhập
- Nhập tên đăng nhập
- Nhập mật khẩu
- Đăng nhập vào hệ thống

### 5.2. Loại tài khoản đăng nhập
Hệ thống hỗ trợ các loại tài khoản sau:

#### a. Tài khoản dùng thử 7 ngày
- Có thời hạn sử dụng trong 7 ngày
- Phù hợp cho khách hàng trải nghiệm ứng dụng
- Sau khi hết hạn, tài khoản sẽ bị khóa hoặc yêu cầu nâng cấp

#### b. Tài khoản vĩnh viễn
- Không giới hạn thời gian sử dụng
- Dành cho người dùng đã mua bản chính thức

---

## 6. Định hướng thiết kế UI
UI cần được thiết kế theo phong cách:
- **Trẻ trung**
- **Năng động**
- **Hiện đại**
- **Dễ nhìn, dễ thao tác**

### 6.1. Tối ưu cho điện thoại 6.5 - 7 inch
- Giao diện cần ưu tiên hiển thị tốt trên màn hình điện thoại cỡ 6.5 đến 7 inch
- Các tab phải rõ ràng, dễ bấm, dễ chuyển đổi
- Một thời điểm chỉ nên tập trung vào một vùng chức năng chính
- Khu vực đầu trang cần gọn, nút đăng xuất thu nhỏ để không chiếm nhiều diện tích
- Các thanh tiến độ và ô lịch cần dễ đọc, dễ chạm
- Khi bấm vào thanh tiến độ thì danh sách học viên phải đổi ngay theo bộ lọc tương ứng

---

## 7. Cấu trúc dữ liệu học sinh đề xuất

```json
{
  "id": "HS001",
  "ten": "Nguyễn Văn A",
  "cccd": "012345678901",
  "loaiBang": "B tự động",
  "tongHocPhi": 10000000,
  "daNop": 6000000,
  "conThieu": 4000000,
  "daHocLyThuyet": true,
  "soKmDAT": 320,
  "daHocSaHinh": false
}
```

## 8. Cấu trúc dữ liệu lịch học DAT đề xuất

```json
{
  "id": "DAT001",
  "studentId": "HS001",
  "studentName": "Nguyễn Văn A",
  "licenseType": "B tự động",
  "date": "2026-04-12",
  "time": "08:00",
  "note": "Ca sáng sân tập A"
}
```

---

## 9. Luồng sử dụng cơ bản
1. Người dùng mở ứng dụng
2. Đăng nhập bằng tài khoản hợp lệ
3. Xem tab Tiến độ học viên để nắm tổng quan
4. Chạm vào một thanh tiến độ để chuyển sang tab Danh sách học viên đã lọc
5. Chọn học viên đủ điều kiện để đặt lịch DAT
6. Chuyển sang tab Lịch học để xem lịch hôm nay, ngày mai hoặc toàn bộ lịch
7. Lưu và tiếp tục quản lý dữ liệu

---

## 10. Ghi chú cập nhật
- Sau các lần chỉnh sửa giao diện hoặc chức năng, tài liệu mô tả cần được cập nhật đồng thời.
- Mỗi lần sửa xong cần commit và push ngay để có thể kiểm tra nhanh trên điện thoại qua link web.
- Nếu gặp hiện tượng trang trắng khi mở web, cần ưu tiên kiểm tra các file `entry` và `screen` để tránh lỗi import hoặc ghi nhầm nội dung file.
