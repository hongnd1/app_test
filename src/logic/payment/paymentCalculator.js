export const paymentCalculator = {
  calculateRemaining(tongHocPhi, daNop) {
    return Math.max(Number(tongHocPhi || 0) - Number(daNop || 0), 0);
  },

  getPaymentStatus(student) {
    if (student.conThieu <= 0) {
      return { label: "Đã thanh toán", tone: "success" };
    }

    if (student.daNop > 0) {
      return { label: "Còn thiếu học phí", tone: "warning" };
    }

    return { label: "Chưa đóng học phí", tone: "danger" };
  },
};
