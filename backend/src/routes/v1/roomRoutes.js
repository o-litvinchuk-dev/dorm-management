import express from "express";
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
} from "../../controllers/RoomController.js";
import { authenticate, authorize } from "../../middlewares/auth.js";

const router = express.Router();

router.post(
  "/dormitories/:dormitoryId/rooms",
  authenticate,
  authorize("POST", "/api/v1/dormitories/:dormitoryId/rooms"),
  createRoom
);

router.get(
  "/dormitories/:dormitoryId/rooms",
  authenticate,
  authorize("GET", "/api/v1/dormitories/:dormitoryId/rooms"),
  getRooms
);

router.get(
  "/rooms/:id",
  authenticate,
  authorize("GET", "/api/v1/rooms/:id"),
  getRoomById 
);


router.put(
  "/rooms/:id",
  authenticate,
  authorize("PUT", "/api/v1/rooms/:id"),
  updateRoom
);

router.delete(
  "/rooms/:id",
  authenticate,
  authorize("DELETE", "/api/v1/rooms/:id"),
  deleteRoom
);

export default router;