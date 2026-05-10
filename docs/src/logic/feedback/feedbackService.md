# `src/logic/feedback/feedbackService.js`

## Vai tro

Service ghi va doc collection `feedbackReports` tren Firestore cho chuc nang gop y va phan hoi.

## API

- `createFeedbackReport(session, payload)`: teacher/student gui van de app cho host.
- `listFeedbackReports(session)`: host doc danh sach van de app, sap xep moi nhat truoc.
- `listMyFeedbackReports(session)`: teacher/student doc phan hoi cua chinh minh khi can mo rong UI.
- `resolveFeedbackReport(session, reportId)`: host danh dau van de da xu ly.
- `deleteResolvedFeedbackReport(session, reportId)`: host xoa report da xu ly.
- `subscribeFeedbackReports(session, callback, onError)`: host lang nghe realtime de nhan thong bao khi co feedback moi.

## Collection

`feedbackReports/{uid_timestamp}` gom `title`, `description`, `status`, thong tin nguoi gui va timestamp. Firestore rules chi cho teacher/student create report cua chinh minh; host duoc doc va update status.
