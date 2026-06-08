import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import adsRouter from "./ads.js";
import notariesRouter from "./notaries.js";
import translatorsRouter from "./translators.js";
import coursesRouter from "./courses.js";
import usersRouter from "./users.js";
import adminRouter from "./admin.js";
import messagesRouter from "./messages.js";
import translationRequestsRouter from "./translation-requests.js";
import ordersRouter from "./orders.js";
import verificationRouter from "./verification.js";
import authRouter from "./auth.js";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(adsRouter);
router.use(notariesRouter);
router.use(translatorsRouter);
router.use(coursesRouter);
router.use(usersRouter);
router.use(adminRouter);
router.use(messagesRouter);
router.use(translationRequestsRouter);
router.use(ordersRouter);
router.use(verificationRouter);

export default router;
