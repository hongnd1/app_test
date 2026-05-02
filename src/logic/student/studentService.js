import { createStudentModel } from "../../models/Student.js";
import { paymentService } from "../payment/paymentService.js";
import { studentRepository } from "./studentRepository.js";
import { studentValidator } from "./studentValidator.js";

function generateStudentId(students) {
  const maxId = students.reduce((max, student) => {
    const numericId = Number(student.id.replace("HS", ""));
    return Number.isNaN(numericId) ? max : Math.max(max, numericId);
  }, 0);

  return `HS${String(maxId + 1).padStart(3, "0")}`;
}

function normalizeStudents(students) {
  return students.map((student) =>
    paymentService.enrichPayment(
      createStudentModel({
        ...student,
        loaiBang: student.loaiBang ?? "B tự động",
      }),
    ),
  );
}

export const studentService = {
  async getAllStudents() {
    return normalizeStudents(await studentRepository.getAll());
  },

  async getStudentById(studentId) {
    return (await this.getAllStudents()).find((student) => student.id === studentId) ?? null;
  },

  async createStudent(data) {
    const students = await this.getAllStudents();
    const student = createStudentModel({
      ...data,
      id: generateStudentId(students),
    });

    const validation = studentValidator.validate(student);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    await studentRepository.save(student);
    return { success: true, student };
  },

  async updateStudent(studentId, data) {
    const students = await this.getAllStudents();
    const currentStudent = students.find((student) => student.id === studentId);

    if (!currentStudent) {
      return { success: false, message: "Không tìm thấy học sinh cần cập nhật." };
    }

    const updatedStudent = createStudentModel({
      ...currentStudent,
      ...data,
      id: studentId,
    });

    const validation = studentValidator.validate(updatedStudent);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    await studentRepository.save(updatedStudent);

    return { success: true, student: updatedStudent };
  },

  async deleteStudent(studentId) {
    await studentRepository.remove(studentId);
  },
};
