export const mockSchedules = [
  {
    id: "DAT001",
    studentId: "HS001",
    studentName: "Nguyễn Văn An",
    licenseType: "B tự động",
    date: new Date().toISOString().slice(0, 10),
    startTime: "08:00",
    endTime: "10:00",
    note: "Ca sáng sân tập A",
  },
  {
    id: "DAT002",
    studentId: "HS004",
    studentName: "Phạm Thanh Hà",
    licenseType: "D",
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    startTime: "14:00",
    endTime: "16:00",
    note: "Ca chiều tuyến 2",
  },
];
