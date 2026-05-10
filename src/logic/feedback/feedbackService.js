import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firestore } from "../../data/config/firebase.js";

const FEEDBACK_COLLECTION = "feedbackReports";

function normalizeTimestamp(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  return "";
}

function normalizeFeedback(docSnapshot) {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    ...data,
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
    resolvedAt: normalizeTimestamp(data.resolvedAt),
  };
}

export const feedbackService = {
  async createFeedbackReport(session, payload) {
    if (!session?.uid || !session.permissions?.canSubmitFeedback) {
      return { success: false, message: "Bạn không có quyền gửi góp ý." };
    }

    const title = String(payload.title || "").trim();
    const description = String(payload.description || "").trim();

    if (title.length < 3) {
      return { success: false, message: "Vui lòng nhập tiêu đề vấn đề." };
    }

    if (description.length < 10) {
      return { success: false, message: "Vui lòng mô tả vấn đề ít nhất 10 ký tự." };
    }

    const reportId = `${session.uid}_${Date.now()}`;
    const report = {
      id: reportId,
      title: title.slice(0, 120),
      description: description.slice(0, 1200),
      status: "open",
      authorUid: session.uid,
      authorEmail: session.email || "",
      authorName: session.displayName || "",
      authorRole: session.effectiveRole || session.role || "viewer",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(firestore, FEEDBACK_COLLECTION, reportId), report);
    return { success: true, report: { ...report, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } };
  },

  async listFeedbackReports(session) {
    if (!session?.permissions?.canViewFeedbackReports) {
      return [];
    }

    const snapshot = await getDocs(query(collection(firestore, FEEDBACK_COLLECTION), orderBy("createdAt", "desc")));
    return snapshot.docs.map(normalizeFeedback);
  },

  async listMyFeedbackReports(session) {
    if (!session?.permissions?.canSubmitFeedback) {
      return [];
    }

    const snapshot = await getDocs(
      query(
        collection(firestore, FEEDBACK_COLLECTION),
        where("authorUid", "==", session.uid),
        orderBy("createdAt", "desc"),
      ),
    );
    return snapshot.docs.map(normalizeFeedback);
  },

  async resolveFeedbackReport(session, reportId) {
    if (!session?.permissions?.canViewFeedbackReports) {
      return { success: false, message: "Bạn không có quyền xử lý góp ý." };
    }

    await updateDoc(doc(firestore, FEEDBACK_COLLECTION, reportId), {
      status: "resolved",
      resolvedAt: serverTimestamp(),
      resolvedBy: session.uid,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  },

  async deleteResolvedFeedbackReport(session, reportId) {
    if (!session?.permissions?.canViewFeedbackReports) {
      return { success: false, message: "Bạn không có quyền xóa góp ý." };
    }

    await deleteDoc(doc(firestore, FEEDBACK_COLLECTION, reportId));
    return { success: true };
  },

  subscribeFeedbackReports(session, callback, onError) {
    if (!session?.permissions?.canViewFeedbackReports) {
      return () => {};
    }

    return onSnapshot(
      query(collection(firestore, FEEDBACK_COLLECTION), orderBy("createdAt", "desc")),
      (snapshot) => callback(snapshot.docs.map(normalizeFeedback)),
      onError,
    );
  },
};
