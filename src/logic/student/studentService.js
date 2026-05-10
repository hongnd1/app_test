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
  async getAllStudents(session = null) {
    return normalizeStudents(await studentRepository.getAll(session));
  },

  async getStudentById(studentId, session = null) {
    return (await this.getAllStudents(session)).find((student) => student.id === studentId) ?? null;
  },

  async createStudent(data, session = null) {
    const students = await this.getAllStudents(session);
    const student = createStudentModel({
      ...data,
      id: generateStudentId(students),
      teacherUid: data.teacherUid || session?.uid || "",
    });

    const validation = studentValidator.validate(student);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    await studentRepository.save(student);
    return { success: true, student };
  },

  async updateStudent(studentId, data, session = null) {
    const students = await this.getAllStudents(session);
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

  async updateStudentDat(studentId, soKmDAT, session = null) {
    const students = await this.getAllStudents(session);
    const currentStudent = students.find((student) => student.id === studentId);

    if (!currentStudent) {
      return { success: false, message: "Không tìm thấy học sinh cần cập nhật km DAT." };
    }

    const updatedStudent = createStudentModel({
      ...currentStudent,
      soKmDAT,
    });

    await studentRepository.save(updatedStudent);
    return { success: true, student: updatedStudent };
  },

  async deleteStudent(studentId) {
    await studentRepository.remove(studentId);
  },
};
