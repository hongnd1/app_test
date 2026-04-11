export const paymentCalculator = {
  calculateRemaining(tongHocPhi, daNop) {
    return Math.max(Number(tongHocPhi || 0) - Number(daNop || 0), 0);
  },

  getPaymentStatus(student) {
    if (student.conThieu <= 0) {
      return { label: "Da thanh toan", tone: "success" };
    }

    if (student.daNop > 0) {
      return { label: "Con thieu hoc phi", tone: "warning" };
    }

    return { label: "Chua dong hoc phi", tone: "danger" };
  },
};
