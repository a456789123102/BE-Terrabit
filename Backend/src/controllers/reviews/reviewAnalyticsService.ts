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
      where: {},
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

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

    const groupedData = ratings.reduce(
      (acc, rating) => {
        const weekNum = String(
          getWeekNumber(new Date(rating.createdAt))
        ).padStart(2, "0");
        const label = `${weekNum}-${new Date(rating.createdAt).getFullYear()}`;

        if (!acc[label]) {
          acc[label] = { label: `Week ${label}`, totalUserRatings: 0, averageRating: 0 };
        }
    
        acc[label].totalUserRatings++;
        acc[label].averageRating += rating.rating;
    
        return acc;
      },
      { ...expectedData }
    );
    

    const data = Object.values(groupedData).map((e) => ({
      ...e,
      averageRating:
        e.totalUserRatings > 0 ? e.averageRating / e.totalUserRatings : 0,
    }));

    const totalReviewer = ratingStats._count.id || 0;
    const totalRating = ratingStats._avg.rating || 0;

    let lastWowReviewer = 0;
    const prevTotalReviewer = data[data.length - 2].totalUserRatings;
    const currentTotalReviewer = data[data.length - 1].totalUserRatings;
    if (prevTotalReviewer !== 0) {
      lastWowReviewer =
        (currentTotalReviewer - prevTotalReviewer) / prevTotalReviewer;
    } else {
      lastWowReviewer = currentTotalReviewer > 0 ? 1 : 0;
    }

    let lastWowRatings = 0;
    const prevTotalRatings = data[data.length - 2].averageRating;
    const currentTotalRatings = data[data.length - 1].averageRating;
    if (prevTotalRatings !== 0) {
      lastWowRatings =
        (currentTotalRatings - prevTotalRatings) / prevTotalRatings;
    } else {
      lastWowRatings = currentTotalRatings > 0 ? 1 : 0;
    }

    return res
      .status(200)
      .json({
        totalReviewer,
        totalRating,
        lastWowRatings,
        lastWowReviewer,
        data,
      });
  } catch (error) {
    console.error("Error fetching weeklyRatingForCharts:", error);
    return res.status(500).json({
      message: "Failed to fetch weekly rating Charts data",
      error,
    });
  }
};

 ////////////////////////////////////////////////////////////////////////
  export const getTotalReviewsForCharts = async (req: Request, res: Response) => {
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
      const reviews = await prisma.review.findMany({
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
          comments: number;
          ratings: number;
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
          expectedData[label] = { label, comments: 0, ratings:0 };
          date.setMonth(date.getMonth() + 1);
        }
      } else if (interval === "weekly") {
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const weekNumber = getWeekNumber(currentDate);
          const label = `Week ${weekNumber} (${currentDate.getFullYear()})`;
  
          expectedData[label] = { label, comments: 0, ratings:0 };
          currentDate.setDate(currentDate.getDate() + 7);
        }
      } else if (interval === "daily") {
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const label = currentDate.toISOString().split("T")[0]; 
          expectedData[label] = { label, comments: 0, ratings:0 };
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
  
      const groupedData = reviews.reduce(
        (acc, review) => {
          const date = new Date(review.createdAt);
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
          acc[label].comments ++;
          acc[label].ratings += review.rating !== null && review.rating !== undefined ? review.rating : 0;
          return acc;
        },
        { ...expectedData }
      );
  
  const result = Object.values(groupedData)
    .map((item) => ({
      ...item,
      ratings: item.comments > 0 ? Number((item.ratings / item.comments).toFixed(2)) : 0
 
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
 
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
      const totalComments = result.reduce((acc, cur) => acc + cur.comments, 0);
      const totalRatings = result.reduce((acc, cur) => acc + (cur.ratings * cur.comments), 0);
      const averageRating = totalComments > 0 ? Number((totalRatings / totalComments).toFixed(2)) : 0;
      
      return res.status(200).json({
       totalComments,
       averageRating,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res
        .status(500)
        .json({ message: "Failed to fetch orders Charts data", error });
    }
  };