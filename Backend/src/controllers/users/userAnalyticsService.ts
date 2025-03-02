import  { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getWeeklyUserForCharts = async (req:Request, res:Response) => {
console.log("USER_GET_WEEKLYCHARTS")
try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7 * 24); 
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const weeklyUsers = await prisma.user.findMany(
        {
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                createdAt: true,
            },
        }
    );

    let expectedData:{[key:string]:{
        label: string;
        total: number;
    }} = {};

    const getWeekNumber = (date: Date): number => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1); // 1 ม.ค. ของปีเดียวกัน
        const pastDaysOfYear = Math.floor(
          (date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24)
        );
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      };

let date = new Date(startDate);
while(date <= endDate) {
    const weekNum = String(getWeekNumber(date)).padStart(2, "0");
    const label = `${weekNum}-${date.getFullYear()}`;
    if (!expectedData[label]) {
        expectedData[label] = {
          label: `Week ${label}`,
          total: 0,
        };
      }
      date.setDate(date.getDate() + 7);
}

const groupedData = weeklyUsers.reduce((acc,user) => {
    const date = new Date(user.createdAt);
    const weekNum = String(getWeekNumber(date)).padStart(2, "0");
    const label = `${weekNum}-${date.getFullYear()}`;
    if(!acc[label]){
        acc[label] = {
...expectedData[label]
        };
    }
    acc[label].total += 1; 
    return acc;
},{...expectedData});
const data = Object.values(groupedData);

const lastWowUser =
data.length < 2
  ? 0
  : data[data.length - 2].total === 0
  ? data[data.length - 1].total > 0
    ? 1
    : 0
  : (data[data.length - 1].total - data[data.length - 2].total) /
    data[data.length - 2].total;

const totalUsers = await prisma.user.aggregate({
    _count:{
        id: true,
    }
});

res.status(200).json({
    data:data,
    totalUsers: totalUsers._count.id,
    wow:lastWowUser
});

} catch (error) {
    console.error("Error fetching userCharts:", error);
    return res.status(500).json({
      message: "Failed to fetch user Charts data",
      error,
    });
  }
};
///////////////////////////////////////////////////////////
  export const getTotalUsersForCharts = async (req: Request, res: Response) => {
    console.log("order_getReviewsCharts");
  
    try {
      const interval = (req.query.interval as string) || "monthly";
      const isCorrectInterval = ["weekly", "monthly", "daily"].includes(interval);
      if (!isCorrectInterval) {
        return res.status(400).json({
          message:
            "Invalid interval. Valid intervals are: weekly, monthly, daily.",
        });
      }
  
      let startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date();
      let endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();
  
      const checkDateLength = (
        startDate: Date,
        endDate: Date,
        interval: string
      ) => {
        const maxEndDate = new Date(startDate);
        if (interval === "monthly")
          maxEndDate.setFullYear(maxEndDate.getFullYear() + 2);
        else if (interval === "weekly")
          maxEndDate.setMonth(maxEndDate.getMonth() + 6);
        else if (interval === "daily")
          maxEndDate.setMonth(maxEndDate.getMonth() + 1);
        return endDate <= maxEndDate;
      };
  
      if (!checkDateLength(startDate, endDate, interval)) {
        return res.status(400).json({
          message: `Invalid date range: The selected end date exceeds the allowed limit for ${interval}.`,
        });
      }
  
      if (endDate < startDate) {
        return res.status(400).json({
          message: "Invalid date range: Start date must be before end date.",
        });
      }
  
      // ดึงข้อมูล
      const users = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });
  
      let expectedData: {
        [key: string]: {
          label: string;
          activeUsers: number;
          inactiveUsers: number;
        };
      } = {};
  
      const getWeekNumber = (date: Date): number => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = Math.floor(
          (date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24)
        );
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      };
  
      if (interval === "monthly") {
        let date = new Date(startDate);
        while (date <= endDate) {
          const label = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}-01`;
          expectedData[label] = { label, activeUsers: 0, inactiveUsers:0 };
          date.setMonth(date.getMonth() + 1);
        }
      } else if (interval === "weekly") {
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const weekNumber = getWeekNumber(currentDate);
          const label = `Week ${weekNumber} (${currentDate.getFullYear()})`;
  
          expectedData[label] = { label, activeUsers: 0, inactiveUsers:0 };
          currentDate.setDate(currentDate.getDate() + 7);
        }
      } else if (interval === "daily") {
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const label = currentDate.toISOString().split("T")[0]; 
          expectedData[label] = { label, activeUsers: 0, inactiveUsers:0 };
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
  
      const groupedData = users.reduce(
        (acc, user) => {
          const date = new Date(user.createdAt);
          const label =
            interval === "daily"
              ? date.toISOString().split("T")[0]
              : interval === "weekly"
              ? `Week ${getWeekNumber(date)} (${date.getFullYear()})`
              : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                  2,
                  "0"
                )}-01`;
  
          if (!acc[label]) {
            acc[label] = { ...expectedData[label] };
          }
          if (user.isActive) {
            acc[label].activeUsers++;
          } else {
            acc[label].inactiveUsers++;
          }
          return acc;
        },
        { ...expectedData }
      );
  
  const result = Object.values(groupedData).sort((a, b) => a.label.localeCompare(b.label));
 
      if (result.length > 0) {
        const startDateObj = new Date(startDate);
        const expectedStartLabel =
          interval === "daily"
            ? startDateObj.toISOString().split("T")[0]
            : interval === "weekly"
            ? `Week ${Math.ceil(
                startDateObj.getDate() / 7
              )} (${startDateObj.getFullYear()}-${String(
                startDateObj.getMonth() + 1
              ).padStart(2, "0")})`
            : `${startDateObj.getFullYear()}-${String(
                startDateObj.getMonth() + 1
              ).padStart(2, "0")}-${String(startDateObj.getDate()).padStart(
                2,
                "0"
              )}`;
        result[0] = { ...result[0], label: expectedStartLabel };
      }
      const totalActiveUsers = result.reduce((acc, cur) => acc + cur.activeUsers, 0);
      const totalinActiveUsers = result.reduce((acc, cur) => acc + cur.inactiveUsers, 0);
     
      return res.status(200).json({
       totalActiveUsers,
       totalinActiveUsers,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res
        .status(500)
        .json({ message: "Failed to fetch orders Charts data", error });
    }
  };
 