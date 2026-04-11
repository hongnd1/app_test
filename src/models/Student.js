export function createStudentModel(data) {
  const tongHocPhi = Number(data.tongHocPhi) || 0;
  const daNop = Number(data.daNop) || 0;

  return {
    id: data.id,
    ten: data.ten.trim(),
    cccd: data.cccd.trim(),
    tongHocPhi,
    daNop,
    conThieu: Math.max(tongHocPhi - daNop, 0),
    daHocLyThuyet: Boolean(data.daHocLyThuyet),
    soKmDAT: Number(data.soKmDAT) || 0,
    daHocSaHinh: Boolean(data.daHocSaHinh),
  };
}
