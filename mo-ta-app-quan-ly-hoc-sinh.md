# Mô tả ứng dụng quản lý học sinh

## 1. Tổng quan
Ứng dụng được xây dựng để hỗ trợ quản lý học sinh trong quá trình học, theo dõi tiến độ đào tạo, tình trạng nộp học phí và hạng bằng đang theo học.

Mục tiêu của ứng dụng là giúp người quản lý dễ dàng:
- Lưu trữ thông tin học sinh
- Theo dõi tình trạng nộp tiền
- Theo dõi tiến độ học tập của từng học sinh
- Lọc và tìm kiếm học sinh theo nhiều tiêu chí
- Quản lý tài khoản đăng nhập theo thời hạn sử dụng
- Theo dõi học viên theo hạng bằng

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

---

## 3. Chức năng chính

### 3.1. Quản lý danh sách học sinh
- Thêm học sinh mới
- Sửa thông tin học sinh
- Xóa học sinh
- Xem chi tiết từng học sinh

### 3.2. Quản lý tài chính
- Cập nhật số tiền học sinh đã nộp
- Tự động tính số tiền còn thiếu
- Hiển thị nhanh trạng thái thanh toán của từng học sinh

Ví dụ:
- Tổng học phí: 10.000.000 VNĐ
- Đã nộp: 6.000.000 VNĐ
- Còn thiếu: 4.000.000 VNĐ

### 3.3. Quản lý tiến độ học tập
- Đánh dấu học sinh đã hoàn thành phần lý thuyết
- Nhập số km DAT đã chạy
- Đánh dấu học sinh đã học sa hình hay chưa
- Hỗ trợ theo dõi tổng quan để biết học sinh đang ở giai đoạn nào

### 3.4. Tìm kiếm và lọc dữ liệu
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

---

## 4. Màn hình đăng nhập
Ứng dụng có **màn hình đăng nhập** để người dùng truy cập hệ thống.

### 4.1. Chức năng đăng nhập
- Nhập tên đăng nhập
- Nhập mật khẩu
- Đăng nhập vào hệ thống

### 4.2. Loại tài khoản đăng nhập
Hệ thống hỗ trợ các loại tài khoản sau:

#### a. Tài khoản dùng thử 7 ngày
- Có thời hạn sử dụng trong 7 ngày
- Phù hợp cho khách hàng trải nghiệm ứng dụng
- Sau khi hết hạn, tài khoản sẽ bị khóa hoặc yêu cầu nâng cấp

#### b. Tài khoản vĩnh viễn
- Không giới hạn thời gian sử dụng
- Dành cho người dùng đã mua bản chính thức

### 4.3. Thông tin hiển thị sau đăng nhập
Sau khi đăng nhập, hệ thống có thể hiển thị:
- Tên tài khoản
- Loại tài khoản
- Thời hạn còn lại đối với tài khoản 7 ngày

---

## 5. Định hướng thiết kế UI
UI cần được thiết kế theo phong cách:
- **Trẻ trung**
- **Năng động**
- **Hiện đại**
- **Dễ nhìn, dễ thao tác**

### 5.1. Gợi ý phong cách giao diện
- Sử dụng màu sắc tươi sáng, hiện đại
- Bố cục gọn gàng, có khoảng trắng hợp lý
- Card thông tin rõ ràng cho từng học sinh
- Các nút thao tác nổi bật như: Thêm, Sửa, Lọc, Lưu
- Form nhập liệu đơn giản, trực quan
- Có thống kê nhanh bằng thẻ thông tin hoặc biểu đồ nhỏ

### 5.2. Gợi ý màn hình chính
Màn hình chính có thể gồm:
- Thanh tiêu đề
- Khu vực tìm kiếm và bộ lọc
- Danh sách học sinh dạng bảng hoặc card
- Khu vực thống kê nhanh như:
  - Tổng số học sinh
  - Số học sinh đã hoàn thành lý thuyết
  - Số học sinh còn thiếu học phí
  - Số học sinh đã học sa hình
  - Số học sinh đã đạt mức DAT

### 5.3. Tối ưu cho điện thoại 6.5 - 7 inch
- Giao diện cần ưu tiên hiển thị tốt trên màn hình điện thoại cỡ 6.5 đến 7 inch
- Các ô thống kê nhanh phải hiển thị dạng **ô vuông** để dễ chạm và dễ đọc
- Khi chạm vào từng ô thống kê, hệ thống sẽ **tự động áp bộ lọc** theo tiêu chí của ô đó
- Bộ lọc và form nhập liệu cần xếp lại hợp lý để thao tác tốt bằng một tay

---

## 6. Cấu trúc chức năng hệ thống

### 6.1. Các module chính
- **Authentication**: quản lý đăng nhập, loại tài khoản, thời hạn sử dụng
- **Student Management**: quản lý thông tin học sinh
- **Payment Management**: quản lý trạng thái nộp tiền
- **Learning Progress Management**: quản lý tiến độ học tập
- **Filter & Search**: lọc và tìm kiếm dữ liệu

---

## 7. Cấu trúc thư mục đề xuất
Các file **logic hoạt động** và **UI** cần được tách riêng ở các folder khác nhau để dễ quản lý, bảo trì và mở rộng.

Ví dụ cấu trúc thư mục:

```text
src/
├── ui/
│   ├── screens/
│   │   ├── LoginScreen
│   │   ├── StudentListScreen
│   │   ├── StudentDetailScreen
│   │   ├── StudentFormScreen
│   │   └── DashboardScreen
│   ├── components/
│   │   ├── StudentCard
│   │   ├── FilterBar
│   │   ├── SearchBox
│   │   ├── PaymentStatusTag
│   │   └── ProgressStatusTag
│   └── styles/
│       ├── colors
│       ├── typography
│       └── theme
│
├── logic/
│   ├── auth/
│   ├── student/
│   ├── payment/
│   ├── progress/
│   └── filter/
│
├── models/
├── data/
└── app/
```

---

## 8. Mô hình dữ liệu học sinh đề xuất

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

---

## 9. Luồng sử dụng cơ bản
1. Người dùng mở ứng dụng
2. Đăng nhập bằng tài khoản hợp lệ
3. Truy cập màn hình danh sách học sinh
4. Tìm kiếm hoặc lọc học sinh theo nhu cầu
5. Chọn học sinh để xem chi tiết
6. Cập nhật thông tin thanh toán, loại bằng hoặc tiến độ học
7. Lưu dữ liệu

---

## 10. Mở rộng trong tương lai
Ứng dụng có thể mở rộng thêm các chức năng như:
- Phân quyền người dùng
- Gửi thông báo nhắc học phí
- Thống kê doanh thu
- Báo cáo tiến độ học sinh
- Xuất Excel hoặc PDF
- Đồng bộ dữ liệu cloud
- Quản lý lịch học và lịch thi

---

## 11. Kết luận
Đây là một ứng dụng quản lý học sinh tập trung vào bốn nhóm chức năng chính:
- Quản lý thông tin cá nhân
- Quản lý loại bằng đào tạo
- Quản lý học phí
- Quản lý tiến độ học tập

Ứng dụng cần có giao diện trẻ trung, năng động, dễ sử dụng, hỗ trợ lọc dữ liệu hiệu quả và đặc biệt phải tối ưu tốt cho điện thoại để kiểm tra nhanh trên thiết bị di động.
