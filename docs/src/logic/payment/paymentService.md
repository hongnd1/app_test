# `src/logic/payment/paymentService.js`

## Vai trò

Wrapper nghiệp vụ cho payment calculator.

## API

- `enrichPayment(student)`: bổ sung `conThieu`.
- `getPaymentStatus(student)`: lấy label/tone thanh toán.

## Task cần lưu ý

- Service không tự kiểm tra quyền; quyền hiển thị phải được xử lý ở UI hoặc service gọi bên trên.

