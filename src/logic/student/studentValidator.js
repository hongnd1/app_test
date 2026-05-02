export const studentValidator = {
  validate(student) {
    if (!student.ten?.trim()) {
      return { valid: false, message: "Tên học sinh không được để trống." };
    }

    if (!/^\d{9,11}$/.test(student.sdt?.trim() ?? "")) {
      return { valid: false, message: "Số điện thoại học viên phải gồm 9 đến 11 chữ số." };
    }

    if (!student.tenZalo?.trim()) {
      return { valid: false, message: "Tên Zalo không được để trống." };
    }

    if (!/^\d{12}$/.test(student.cccd?.trim() ?? "")) {
      return { valid: false, message: "CCCD phải gồm đúng 12 chữ số." };
    }

    if (!student.loaiBang?.trim()) {
      return { valid: false, message: "Vui lòng chọn loại bằng." };
    }

    if (Number(student.tongHocPhi) < 0 || Number(student.daNop) < 0 || Number(student.soKmDAT) < 0) {
      return {
        valid: false,
        message: "Học phí, số tiền đã nộp và km DAT phải là số không âm.",
      };
    }

    if (Number(student.daNop) > Number(student.tongHocPhi)) {
      return {
        valid: false,
        message: "Số tiền đã nộp không được lớn hơn tổng học phí.",
      };
    }

    return { valid: true };
  },
};
