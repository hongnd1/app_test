export const searchService = {
  searchStudents(students, searchTerm) {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.ten.toLowerCase().includes(keyword) ||
        student.cccd.toLowerCase().includes(keyword)
      );
    });
  },
};
