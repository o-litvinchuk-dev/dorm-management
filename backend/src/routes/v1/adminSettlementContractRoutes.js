import express from "express";
import {
  getSettlementAgreementsAdmin,
  getSettlementAgreementByIdAdmin,
  updateSettlementAgreementAdmin,
} from "../../controllers/adminSettlementContractController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = express.Router();

router.use(authenticate); // All routes here require authentication

router.get(
  "/",
  authorize("GET", "/api/v1/admin/settlement-agreements"),
  getSettlementAgreementsAdmin
);

router.get(
  "/:id",
  authorize("GET", "/api/v1/admin/settlement-agreements/:id"),
  getSettlementAgreementByIdAdmin
);

router.put(
  "/:id", // Or "/:id/status" if preferred
  authorize("PUT", "/api/v1/admin/settlement-agreements/:id"), // Or specific status endpoint
  updateSettlementAgreementAdmin
);

// Add DELETE route if hard delete is needed.
// router.delete(
//   "/:id",
//   authorize("DELETE", "/api/v1/admin/settlement-agreements/:id"),
//   deleteSettlementAgreementAdmin
// );

export default router;