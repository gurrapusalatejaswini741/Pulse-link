import { Router, type IRouter } from "express";
import healthRouter from "./health";
import crowdRouter from "./crowd";
import fansRouter from "./fans";
import notificationsRouter from "./notifications";
import checkinsRouter from "./checkins";
import venuesRouter from "./venues";
import geminiRouter from "./gemini/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use(crowdRouter);
router.use(fansRouter);
router.use(notificationsRouter);
router.use(checkinsRouter);
router.use(venuesRouter);
router.use(geminiRouter);

export default router;
