import { Router } from "express";
import { createTicket, createReplyMessage,getAllTickets,getTicketById,closeTicket,getmyTickets } from "../../controllers/tickets/ticketController";
//getTicketById, closeTicket

import { verifyUser, verifyAdmin } from "../../middlewares/verify";

const router = Router();

router.post("/create", verifyUser, createTicket);
router.post("/reply", verifyUser, createReplyMessage);
router.get("/all", verifyAdmin, getAllTickets);
router.get("/:id/info", verifyUser, getTicketById);
router.patch("/:id/close", verifyUser, closeTicket);
router.get("/myTickets", verifyUser, getmyTickets);

export default router;