import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CustomRequest } from "../../middlewares/verify";

const prisma = new PrismaClient();

export const createTicket = async (req: Request, res: Response) => {
    try {
        const { topic, details } = req.body;
        const user = (req as CustomRequest).user;

        // สร้าง Ticket ใหม่
        const ticket = await prisma.ticket.create({
            data: {
                topic,
                details,
                userId: user.id,
            }
        });

        const admins = await prisma.user.findMany({
            where: { isAdmin: true,
                isActive: true
             },
            select: { id: true } 
        });

        const adminIds = admins.map(admin => admin.id);

        await Promise.all(
            adminIds.map(adminId =>
                prisma.notification.create({
                    data: {
                        userId: adminId,
                        message: `New ticket created: #${ticket.id} - ${topic}`,
                        url: `/ticket/${ticket.id}/info`,
                    }
                })
            )
        );

        return res.status(201).json(ticket);
    } catch (error) {
        console.error("Error creating ticket:", error);
        return res.status(500).json({ message: "Error creating ticket", error });
    }
};

// สร้างข้อความตอบกลับ0hk
export const createReplyMessage = async (req: Request, res: Response) => {
    try {
      const {content} = req.body;
      
      // ตรวจสอบว่ามีค่า ticketId หรือไม่
      const ticketId = parseInt(req.params.id);
      
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
  
      const user = (req as CustomRequest).user;
  
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId }
      });
      console.log("ticket",ticket);
  
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
  
      const userAcc = await prisma.user.findUnique({
        where: { id: user.id },
        select: {id:true, username:true,isAdmin: true }
      });
  
      if (!userAcc) {
        return res.status(404).json({ message: "User not found" });
      }
  

        const reply = await prisma.message.create({
            data: {
                ticketId,
                content,
                senderId:user.id,
            }
        });

        let isAdmin = userAcc.isAdmin ?? false;
  
        const admins = await prisma.user.findMany({
          where: { isAdmin: true, isActive: true },
          select: { id: true }
        });
  
          const adminIds = admins.map(admin => admin.id);
  
        if(isAdmin){
            await prisma.notification.create({
                data: {
                    userId: ticket.userId,
                    message: `New reply on ticket #${ticket.id}`,
                    url: `/ticket/${ticket.id}/info`,
                }
            })
            console.log("noti sending to user",ticket.userId)
        }else{
            await Promise.all(
                adminIds.map(adminId =>
                    prisma.notification.create({
                        data: {
                            userId: adminId,
                            message:  `New reply from user: ${userAcc.username} userId:${userAcc.id} on ticket #${ticket.id}`,
                            url: `/ticket/${ticket.id}/info`,
                        }
                    })
                )
            );
        }
        return res.status(201).json(reply);

    } catch (error) {
        console.error("Error creating reply message:", error);
        return res.status(500).json({ message: "Error creating reply message", error });

    }
}


export const getAllTickets = async (req: Request, res: Response) => {
    try {
        const search = (req.query.search as string) || "";
        const orderBy = (req.query.orderBy as "asc" | "desc") || "desc";
        const orderWith = (req.query.orderWith as string) || "createdAt";
        const isSolved = req.query.isSolved ? String(req.query.isSolved) === "true" : undefined;
        const page = Math.max(Number(req.query.page) || 1, 1);
        const pageSize = Math.max(Number(req.query.pageSize) || 10, 1); 
        const offset = (page - 1) * pageSize;
    
        const tickets = await prisma.ticket.findMany({
            skip: offset,
            take: pageSize,
            where: {
                ...(search
                    ? {
                        OR: [
                            { topic: { contains: search } },
                            { details: { contains: search } },
                            !isNaN(Number(search)) ? { userId: Number(search) } : undefined,
                            !isNaN(Number(search)) ? { id: Number(search) } : undefined,
                        ].filter(Boolean) as any, 
                    }
                    : {}),
                ...(isSolved !== undefined ? { isSolved } : {}),
            },
            orderBy: {
                [orderWith]: orderBy,
            },
        });

        return res.status(200).json({ page, pageSize, tickets });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return res.status(500).json({ message: "Error fetching tickets", error });
    }
};
// ดึงticket ของตัวเอง

export const getmyTickets = async (req: Request, res: Response) => {
    try {
        const user = (req as CustomRequest).user;
        const search = (req.query.search as string) || "";
        const orderBy = (req.query.orderBy as "asc" | "desc") || "desc";
        const orderWith = (req.query.orderWith as string) || "createdAt";
        const isSolved = req.query.isSolved ? String(req.query.isSolved) === "true" : undefined;
        const page = Math.max(Number(req.query.page) || 1, 1);
        const pageSize = Math.max(Number(req.query.pageSize) || 10, 1); 
        const offset = (page - 1) * pageSize;

        const reqUser = await prisma.user.findUnique(
  {
    where: { id: user.id },
    select: { isAdmin: true }
  }
        )

        const tickets = await prisma.ticket.findMany({
            skip: offset,
            take: pageSize,
            where: {
                ...(search
                    ? {
                        OR: [
                            { topic: { contains: search } },
                            { details: { contains: search } },
                            !isNaN(Number(search)) ? { userId: Number(search) } : undefined,
                            !isNaN(Number(search)) ? { id: Number(search) } : undefined,
                        ].filter(Boolean) as any, 
                    }
                    : {}), 
                ...(isSolved !== undefined ? { isSolved } : {}),
                ...( reqUser && reqUser.isAdmin ? {} : { userId: user.id }),
            },
            orderBy: {
                [orderWith]: orderBy,
            },
        });
        

        const pagination = {
            page,
            pageSize,
            totalPages: Math.ceil(tickets.length / pageSize),
            totalItems: tickets.length,
        }

        return res.status(200).json({ pagination, tickets });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return res.status(500).json({ message: "Error fetching tickets", error });
    }
};


// ดึง Ticket ตาม ID เอา message มาด้วย   

export const getTicketById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const userId = (req as CustomRequest).user;
        const requestUser = await prisma.user.findFirst({
            where: { id: userId.id },
            select: { 
                id: true,
                isAdmin: true,
            }
        });
        if(!requestUser){
            return res.status(403).json({ message: "Unauthorized" });
        }
        
        const ticket = await prisma.ticket.findUnique({
            where: { id: Number(id) },
            include: {
                user: {
                    select: {
                        username: true,
                        isAdmin: true,
                    },
                },
                messages: {
                    select: {
                        content: true,
                        createdAt: true,
                        senderId: true,
                        sender: {
                            select: {
                                username: true,
                                isAdmin: true,
                            },
                        },
                    },
                },
            },
        });

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }
        if(!requestUser.isAdmin && requestUser.id!== ticket.userId){
            return res.status(403).json({ message: "Unauthorized no perm" });
        }

        return res.status(200).json(ticket);
    } catch (error) {
        console.error("Error fetching ticket:", error);
        return res.status(500).json({ message: "Error fetching ticket", error });
    }
};

//closed ticket
export const closeTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as CustomRequest).user;

 
        const requestUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, isAdmin: true },
        });

        if (!requestUser) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: Number(id) },
            select: { id: true, userId: true, isSolved: true }
        });

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        if (!requestUser.isAdmin && requestUser.id !== ticket.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id: Number(id) },
            data: { isSolved: true },
            select: { id: true, isSolved: true } 
        });

        return res.status(200).json({ message: `Ticket ID ${id} closed`, ticket: updatedTicket });
    } catch (error) {
        console.error("❌ Error closing ticket:", error);
        return res.status(500).json({ message: "Error closing ticket", error });
    }
};

export const justCountTickets = async (req:Request,res:Response) => {
    try {
        const user = (req as CustomRequest).user;

        const requestUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, isAdmin: true },
        });
        const  isRequestAdmin = requestUser ? requestUser.isAdmin : false;

        const ticketCount = await prisma.ticket.groupBy({
            by: ["isSolved"],
            where: !isRequestAdmin ? { userId: user.id } : {},
            _count: {
              isSolved: true,
            },
          });
          const solvedCount = Number(ticketCount.find((item) => item.isSolved === true)?._count?.isSolved) || 0;
          const unsolvedCount = Number(ticketCount.find((item) => item.isSolved === false)?._count?.isSolved) || 0;
          
          return res.status(200).json({ all: solvedCount + unsolvedCount, solved: solvedCount, unsolved: unsolvedCount });
          
    } catch (error) {
        console.error("Error counting tickets:", error);
        return res.status(500).json({ message: "Error counting tickets", error });
        
    }
}
