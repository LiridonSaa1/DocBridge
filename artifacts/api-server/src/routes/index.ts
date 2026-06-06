import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adsRouter from "./ads";
import notariesRouter from "./notaries";
import translatorsRouter from "./translators";
import coursesRouter from "./courses";
import usersRouter from "./users";
import adminRouter from "./admin";
import messagesRouter from "./messages";
import translationRequestsRouter from "./translation-requests";
import ordersRouter from "./orders";
import verificationRouter from "./verification";

const router: IRouter = Router();

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
