import express from "express";
import { createUser } from "../services/user.service";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// All user routes require authentication
router.use(verifyTokenMiddleware);

router.post("/", async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json({ success: true, user });
  } catch (err: any) {
    console.error("Create User Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
