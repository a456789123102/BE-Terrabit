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