# `src/logic/payment/paymentCalculator.js`

## Vai trò

Tính học phí còn thiếu và trạng thái thanh toán.

## API

- `calculateRemaining(tongHocPhi, daNop)`: trả về số tiền còn thiếu, không âm.
- `getPaymentStatus(student)`: trả về `{ label, tone }` cho UI.

## Task cần lưu ý

- Học phí có thể là thông tin nhạy cảm; role `student` và `viewer` không nên xem nếu policy xem học phí là private.
- Khi ẩn học phí, service vẫn có thể tính nhưng UI không render nếu thiếu `canViewSensitiveStudentInfo`.

