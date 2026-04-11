import { paymentCalculator } from "./paymentCalculator.js";

export const paymentService = {
  enrichPayment(student) {
    return {
      ...student,
      conThieu: paymentCalculator.calculateRemaining(student.tongHocPhi, student.daNop),
    };
  },

  getPaymentStatus(student) {
    return paymentCalculator.getPaymentStatus(student);
  },
};
