const admin = require("firebase-admin");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();
const REGION = "asia-southeast1";
const TIME_ZONE = "Asia/Ho_Chi_Minh";
const APP_URL = "https://hongnd1.github.io/app_test/";
const FUNCTIONS_ENABLED = process.env.FUNCTIONS_ENABLED !== "false";
const ALLOWED_NOTIFICATION_ROLES = new Set(["admin", "staff"]);

function chunk(array, size) {
  const items = [];
  for (let index = 0; index < array.length; index += size) {
    items.push(array.slice(index, index + size));
  }
  return items;
}

function uniqTokens(items) {
  const tokenMap = new Map();
  items.forEach((item) => {
    if (!item.token || !item.id) {
      return;
    }
    tokenMap.set(item.token, item);
  });
  return [...tokenMap.values()];
}

async function getActiveNotificationTokens() {
  const snapshot = await db.collection("notificationTokens").where("enabled", "==", true).get();
  return uniqTokens(
    snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((item) => ALLOWED_NOTIFICATION_ROLES.has(String(item.role || "").toLowerCase())),
  );
}

async function disableInvalidTokens(invalidTokenDocs) {
  if (!invalidTokenDocs.length) {
    return;
  }

  const batch = db.batch();
  invalidTokenDocs.forEach((item) => {
    batch.update(db.collection("notificationTokens").doc(item.id), {
      enabled: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}

async function sendBatchedNotification(tokenDocs, message) {
  const batches = chunk(tokenDocs, 500);
  let successCount = 0;
  let failureCount = 0;
  const invalidTokenDocs = [];

  for (const batchItems of batches) {
    const response = await messaging.sendEachForMulticast({
      tokens: batchItems.map((item) => item.token),
      notification: message.notification,
      data: message.data,
      webpush: message.webpush,
    });

    response.responses.forEach((result, index) => {
      if (result.success) {
        successCount += 1;
        return;
      }

      failureCount += 1;
      const errorCode = result.error?.code || "";
      if (
        errorCode.includes("registration-token-not-registered") ||
        errorCode.includes("invalid-registration-token")
      ) {
        invalidTokenDocs.push(batchItems[index]);
      }
    });
  }

  await disableInvalidTokens(invalidTokenDocs);

  return {
    successCount,
    failureCount,
    invalidCount: invalidTokenDocs.length,
  };
}

exports.notifyDatScheduleCreated = onDocumentCreated(
  {
    document: "schedules/{scheduleId}",
    region: REGION,
  },
  async (event) => {
    if (!FUNCTIONS_ENABLED) {
      logger.info("Functions disabled by FUNCTIONS_ENABLED=false", {
        functionName: "notifyDatScheduleCreated",
      });
      return;
    }

    const schedule = event.data?.data();
    const scheduleId = event.params.scheduleId;

    if (!schedule) {
      logger.info("No schedule data found on create.", { scheduleId });
      return;
    }

    const tokenDocs = await getActiveNotificationTokens();
    logger.info("notifyDatScheduleCreated tokens fetched.", {
      scheduleId,
      tokenCount: tokenDocs.length,
    });

    if (!tokenDocs.length) {
      return;
    }

    const studentName = schedule.studentName || "Học viên";
    const date = schedule.date || "";
    const startTime = schedule.startTime || "";

    const result = await sendBatchedNotification(tokenDocs, {
      notification: {
        title: "Lịch DAT mới",
        body: `Học viên ${studentName} đăng ký chạy DAT ngày ${date} lúc ${startTime}. Cần hẹn địa điểm.`,
      },
      data: {
        type: "DAT_SCHEDULE_CREATED",
        scheduleId,
        studentName,
        date,
        startTime,
        title: "Lịch DAT mới",
        body: `Học viên ${studentName} đăng ký chạy DAT ngày ${date} lúc ${startTime}. Cần hẹn địa điểm.`,
      },
      webpush: {
        fcmOptions: {
          link: APP_URL,
        },
      },
    });

    await db.collection("schedules").doc(scheduleId).set(
      {
        datCreatedNotificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    logger.info("notifyDatScheduleCreated finished.", {
      scheduleId,
      successCount: result.successCount,
      failureCount: result.failureCount,
      invalidCount: result.invalidCount,
    });
  },
);

exports.sendPendingDatReminder = onSchedule(
  {
    schedule: "0 21,22 * * *",
    timeZone: TIME_ZONE,
    region: REGION,
  },
  async () => {
    if (!FUNCTIONS_ENABLED) {
      logger.info("Functions disabled by FUNCTIONS_ENABLED=false", {
        functionName: "sendPendingDatReminder",
      });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const snapshot = await db.collection("schedules").where("date", ">=", today).get();
    const pendingSchedules = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (item) =>
          item.meetingLocationStatus === "pending" ||
          item.teacherConfirmed !== true,
      );

    if (!pendingSchedules.length) {
      logger.info("sendPendingDatReminder skipped. No pending schedules.");
      return;
    }

    const tokenDocs = await getActiveNotificationTokens();
    logger.info("sendPendingDatReminder tokens fetched.", {
      pendingCount: pendingSchedules.length,
      tokenCount: tokenDocs.length,
    });

    if (!tokenDocs.length) {
      return;
    }

    const result = await sendBatchedNotification(tokenDocs, {
      notification: {
        title: "Nhắc lịch chạy DAT",
        body: `Có ${pendingSchedules.length} lịch DAT cần hẹn địa điểm. Vui lòng kiểm tra danh sách lịch.`,
      },
      data: {
        type: "DAT_PENDING_REMINDER",
        count: String(pendingSchedules.length),
        title: "Nhắc lịch chạy DAT",
        body: `Có ${pendingSchedules.length} lịch DAT cần hẹn địa điểm. Vui lòng kiểm tra danh sách lịch.`,
      },
      webpush: {
        fcmOptions: {
          link: APP_URL,
        },
      },
    });

    logger.info("sendPendingDatReminder finished.", {
      pendingCount: pendingSchedules.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      invalidCount: result.invalidCount,
    });
  },
);
