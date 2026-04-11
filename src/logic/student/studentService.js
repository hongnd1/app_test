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
  getAllStudents() {
    return normalizeStudents(studentRepository.getAll());
  },

  getStudentById(studentId) {
    return this.getAllStudents().find((student) => student.id === studentId) ?? null;
  },

  createStudent(data) {
    const students = this.getAllStudents();
    const student = createStudentModel({
      ...data,
      id: generateStudentId(students),
    });

    const validation = studentValidator.validate(student);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    studentRepository.saveAll([...students, student]);
    return { success: true, student };
  },

  updateStudent(studentId, data) {
    const students = this.getAllStudents();
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

    studentRepository.saveAll(
      students.map((student) => (student.id === studentId ? updatedStudent : student)),
    );

    return { success: true, student: updatedStudent };
  },

  deleteStudent(studentId) {
    const students = this.getAllStudents();
    studentRepository.saveAll(students.filter((student) => student.id !== studentId));
  },
};
