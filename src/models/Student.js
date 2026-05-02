export function createStudentModel(data) {
  const tongHocPhi = Number(data.tongHocPhi) || 0;
  const daNop = Number(data.daNop) || 0;

  return {
    id: data.id,
    ten: String(data.ten ?? "").trim(),
    sdt: String(data.sdt ?? "").trim(),
    tenZalo: String(data.tenZalo ?? "").trim(),
    cccd: String(data.cccd ?? "").trim(),
    loaiBang: data.loaiBang?.trim() || "B tự động",
    tongHocPhi,
    daNop,
    conThieu: Math.max(tongHocPhi - daNop, 0),
    daHocLyThuyet: Boolean(data.daHocLyThuyet),
    soKmDAT: Number(data.soKmDAT) || 0,
    daHocSaHinh: Boolean(data.daHocSaHinh),
  };
}
