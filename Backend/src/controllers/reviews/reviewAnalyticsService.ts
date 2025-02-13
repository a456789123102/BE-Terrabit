import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getWeeklyRatingForCharts = async (req: Request, res: Response) => {
  console.log("getWeeklyRatingForCharts");
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7 * 24);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const ratings = await prisma.review.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        rating: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const ratingStats = await prisma.review.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _avg: {
        rating: true,
      },
    });

    console.log("Ratings:", ratings);
    console.log("Average Rating:", ratingStats._avg.rating);

    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = Math.floor(
        (date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

let expectedData: {
    [key: string]: {
      label: string;
      totalUserRatings: number;
      averageRating: number;
    };
  } = {};

  let date = new Date(startDate);
  while (date <= endDate) {
    const weekNum = String(getWeekNumber(date)).padStart(2, "0");
    const label = `${weekNum}-${date.getFullYear()}`;

    if (!expectedData[label]) {
      expectedData[label] = {
        label: `Week ${label}`,
        totalUserRatings: 0,
        averageRating: 0,
      };
    }
    date.setDate(date.getDate() + 7);
}

const groupedData = ratings.reduce((acc, rating) => {
    const weekNum = String(getWeekNumber(new Date(rating.createdAt))).padStart(2, "0");
    const label = `${weekNum}-${new Date(rating.createdAt).getFullYear()}`;
    acc[label]. totalUserRatings ++;
    acc[label]. averageRating += rating.rating

    return acc;
}, { ...expectedData });

const data = Object.values(groupedData).map((e) => ({
    ...e, 
    averageRating: e.totalUserRatings > 0 ? e.averageRating / e.totalUserRatings : 0,
  }));
  
  return res.status(200).json(data);

  } catch (error) {
    console.error("Error fetching weeklyRatingForCharts:", error);
    return res.status(500).json({
      message: "Failed to fetch weekly rating Charts data",
      error,
    });
  }
};
