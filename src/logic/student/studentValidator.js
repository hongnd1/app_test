export const studentValidator = {
  validate(student) {
    if (!student.ten?.trim()) {
      return { valid: false, message: "Ten hoc sinh khong duoc de trong." };
    }

    if (!/^\d{12}$/.test(student.cccd?.trim() ?? "")) {
      return { valid: false, message: "CCCD phai gom dung 12 chu so." };
    }

    if (Number(student.tongHocPhi) < 0 || Number(student.daNop) < 0 || Number(student.soKmDAT) < 0) {
      return {
        valid: false,
        message: "Hoc phi, so tien da nop va km DAT phai la so khong am.",
      };
    }

    if (Number(student.daNop) > Number(student.tongHocPhi)) {
      return {
        valid: false,
        message: "So tien da nop khong duoc lon hon tong hoc phi.",
      };
    }

    return { valid: true };
  },
};
