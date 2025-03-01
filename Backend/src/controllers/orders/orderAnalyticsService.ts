import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

///////////////////////////////////////////////////////////////////////////////////////////////////
export const getOrderForCharts = async (req: Request, res: Response) => {
  console.log("order_getForCharts");

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

    // ดึงข้อมูลคำสั่งซื้อ
    const orders = await prisma.order.findMany({
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

    // สร้าง expectedData สำหรับกราฟ
    let expectedData: {
      [key: string]: {
        label: string;
        totalOrders: number;
        pending: number;
        success: number;
        rejected: number;
      };
    } = {};

    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1); // 1 ม.ค. ของปีเดียวกัน
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
        expectedData[label] = {
          label,
          totalOrders: 0,
          pending: 0,
          success: 0,
          rejected: 0,
        };
        date.setMonth(date.getMonth() + 1);
      }
    } else if (interval === "weekly") {
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const weekNumber = getWeekNumber(currentDate);
        const label = `Week ${weekNumber} (${currentDate.getFullYear()})`;

        expectedData[label] = {
          label,
          totalOrders: 0,
          pending: 0,
          success: 0,
          rejected: 0,
        };

        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else if (interval === "daily") {
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const label = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
        expectedData[label] = {
          label,
          totalOrders: 0,
          pending: 0,
          success: 0,
          rejected: 0,
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }


    const groupedData = orders.reduce(
      (acc, order) => {
        const date = new Date(order.createdAt);
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
          acc[label] = {
            label,
            totalOrders: 0,
            pending: 0,
            success: 0,
            rejected: 0,
          };
        }

        acc[label].totalOrders += 1;
        if (
          [
            "pending_payment_proof",
            "pending_refound",
            "pending_payment_verification",
          ].includes(order.status)
        ) {
          acc[label].pending += 1;
        } else if (order.status === "payment_verified") {
          acc[label].success += 1;
        } else if (
          ["cancelled_by_admin", "cancelled_by_user","refund_rejected","refund_completed"].includes(order.status)
        ) {
          acc[label].rejected += 1;
        }

        return acc;
      },
      { ...expectedData }
    );

    const result = Object.values(groupedData); 

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
    const total = ["totalOrders", "pending", "success", "rejected"].reduce<
      Record<string, number>
    >((acc, key) => {
      acc[key] = result.reduce((sum, curr) => sum + (curr as any)[key], 0); 
      return acc;
    }, {});

    const ComparativeGrowth = [
      "totalOrders",
      "pending",
      "success",
      "rejected",
    ].reduce<Record<string, number>>((acc, key) => {
      const current = (result[result.length - 1] as any)?.[key] || 0;
      const previous = (result[result.length - 2] as any)?.[key] || 0;

      acc[key] =
        previous === 0
          ? current > 0
            ? 1
            : 0
          : (current - previous) / previous;
      return acc;
    }, {});

    return res.status(200).json({ data: result, total, ComparativeGrowth });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch orders Charts data", error });
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const getTotalIncomesForCharts = async (req: Request, res: Response) => {
  console.log("order_getIncomeCharts");

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
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status:"payment_verified",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // สร้าง expectedData สำหรับกราฟ
    let expectedData: {
      [key: string]: {
        label: string;
        total: number;
      };
    } = {};

    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1); // 1 ม.ค. ของปีเดียวกัน
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
        expectedData[label] = { label, total: 0 };
        date.setMonth(date.getMonth() + 1);
      }
    } else if (interval === "weekly") {
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const weekNumber = getWeekNumber(currentDate);
        const label = `Week ${weekNumber} (${currentDate.getFullYear()})`;

        expectedData[label] = {
          label,
          total: 0,
        };
        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else if (interval === "daily") {
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const label = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD
        expectedData[label] = { label, total: 0 };
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // จัดกลุ่มข้อมูลจาก `orders`
    const groupedData = orders.reduce(
      (acc, order) => {
        const date = new Date(order.createdAt);
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
        acc[label].total += order.totalPrice || 0;
        return acc;
      },
      { ...expectedData }
    );

const result = Object.values(groupedData)
  .map((item) => ({
    ...item,
    total: Number(item.total.toFixed(2)), 
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
    const TotalIncomes = Number(result.reduce((acc, cur) => acc + cur.total, 0).toFixed(2));
    return res.status(200).json({
      totalIncomes: TotalIncomes,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch orders Charts data", error });
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const getTopSellerItems = async (req: Request, res: Response) => {
  console.log("order_getTopSeller");

  try {
    const interval = req.query.interval as string;
    const length = Number(req.query.length) || 10;
    let orderBy = (req.query.orderBy as string) || "quantity"; // ⚡ Default เป็น "quantity"
    let startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    let endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;


    // ตรวจสอบ interval
    const isCorrectInterval = ["weekly", "monthly", "daily"].includes(interval);
    if (interval && !isCorrectInterval) {
      return res.status(400).json({
        message: "Invalid interval. Valid intervals are: weekly, monthly, daily.",
      });
    }
    const checkDateLength = (startDate: Date, endDate: Date, interval: string) => {
      const maxEndDate = new Date(startDate);
      if (interval === "monthly") maxEndDate.setFullYear(maxEndDate.getFullYear() + 2);
      else if (interval === "weekly") maxEndDate.setMonth(maxEndDate.getMonth() + 7);
      else if (interval === "daily") maxEndDate.setMonth(maxEndDate.getMonth() + 1);
      return endDate <= maxEndDate;
    };

    if (startDate && endDate && !checkDateLength(startDate, endDate, interval)) {
      return res.status(400).json({
        message: `Invalid date range: The selected end date exceeds the allowed limit for ${interval}.`,
      });
    }

    // Prisma Query: Group by productId & productName
    const topSellerItems = await prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      _sum: {
        quantity: true,
        price: true,
      },
      where: {
        order: {
          status: "payment_verified",
        },
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      orderBy: {
        _sum: {
          [orderBy]: "desc",
        },
      },
      take: length,
    });

    // จัดรูปแบบข้อมูลที่ดึงมา
    const formattedData = topSellerItems.map((item) => ({
      label: item.productName,
      quantity: item._sum.quantity || 0,
      total: item._sum.price || 0,
    }));

    return res.status(200).json({chartsData:formattedData});
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Failed to fetch orders Charts data", error });
  }
};


////////////////////////////////////////////////////////////////////////////
export const getWeeklySaleForCharts = async (req: Request, res: Response) => {
  try {
    console.log("Getting_weekly_sales");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7 * 24);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(); // วันนี้
    endDate.setHours(23, 59, 59, 999);

    const weeklySalesData = await prisma.order.findMany({
      where: {
        status: "payment_verified",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        totalPrice: true,
      },
    });

    const totalSalesData = await prisma.order.aggregate({
      where: {
        status: "payment_verified",
      },
      _count: {
        id: true,
      },
      _sum: {
        totalPrice: true, 
      },
    });

    // ฟังก์ชันหาหมายเลขสัปดาห์ของปี
    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1); // 1 ม.ค. ของปีเดียวกัน
      const pastDaysOfYear = Math.floor(
        (date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    let expectedData: {
      [key: string]: {
        label: string;
        totalOrders: number;
        totalIncome: number;
      };
    } = {};

    let date = new Date(startDate);
    while (date <= endDate) {
      const weekNum = String(getWeekNumber(date)).padStart(2, "0");
      const label = `${weekNum}-${date.getFullYear()}`;

      if (!expectedData[label]) {
        expectedData[label] = {
          label: `Week ${label}`,
          totalOrders: 0,
          totalIncome: 0,
        };
      }

      date.setDate(date.getDate() + 7);
    }

    // จัดกลุ่มข้อมูลตามสัปดาห์
    const groupedData = weeklySalesData.reduce(
      (acc, order) => {
        const date = new Date(order.createdAt);
        const label = `${String(getWeekNumber(date)).padStart(
          2,
          "0"
        )}-${date.getFullYear()}`;

        if (!acc[label]) {
          acc[label] = { ...expectedData[label] };
        }

        acc[label].totalOrders += 1;
        acc[label].totalIncome += order.totalPrice || 0;

        return acc;
      },
      { ...expectedData }
    );

    const data = Object.values(groupedData);

    // คำนวณค่าทั้งหมด
    const totalOrders = totalSalesData._count.id || 0;
    const lastWowOrders =
      data.length < 2
        ? 0
        : data[data.length - 2].totalOrders === 0
        ? data[data.length - 1].totalOrders > 0
          ? 1
          : 0
        : (data[data.length - 1].totalOrders -
            data[data.length - 2].totalOrders) /
          data[data.length - 2].totalOrders;

    const totalIncome = totalSalesData._sum.totalPrice || 0;
    const lastWowIncomes =
      data.length < 2
        ? 0
        : data[data.length - 2].totalIncome === 0
        ? data[data.length - 1].totalIncome > 0
          ? 1
          : 0
        : (data[data.length - 1].totalIncome -
            data[data.length - 2].totalIncome) /
          data[data.length - 2].totalIncome;

    return res.status(200).json({
      totalOrders,
      lastWowOrders,
      totalIncome,
      lastWowIncomes,
      data,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      message: "Failed to fetch orders Charts data",
      error,
    });
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
export const getYearlySaleForCharts = async (req: Request, res: Response) => {
  try {
    console.log("Getting_Yearly_sales");

    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1, 0, 1);
    const endLastYear = new Date(lastYear);
    endLastYear.setMonth(11, 31);
    endLastYear.setHours(23, 59, 59, 999);

    const totalSales = await prisma.order.findMany({
      where: {
        status:"payment_verified",
        createdAt: {
          gte: lastYear,
        },
      },
      select: {
        createdAt: true,
        totalPrice: true,
        items: true,
      },
    });

    const totalSalesLastYear = await prisma.order.aggregate({
      where: {
        status: "payment_verified",
        createdAt: {
          gte: lastYear,
          lte: endLastYear,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalPrice: true,
      },
    });

    const totalSalesThisYear = await prisma.order.aggregate({
      where: {
        status: "payment_verified",
        createdAt: {
          gt: endLastYear,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalPrice: true,
      },
    });

    let expectedData: {
      [key: string]: {
        label: string;
        thisYearSales: number;
        lastYearSales: number;
        thisYearOrders: number;
        lastYearOrders: number;
        thisYearItemsSales: number;
        lastYearItemsSales: number;
      };
    } = {};

    for (let month = 0; month < 12; month++) {
      const monthlabel = String(month);
      if (!expectedData[monthlabel]) {
        expectedData[monthlabel] = {
          label: `Month-${String(month + 1).padStart(2, "0")} `,
          thisYearSales: 0,
          lastYearSales: 0,
          thisYearOrders: 0,
          lastYearOrders: 0,
          thisYearItemsSales: 0,
          lastYearItemsSales: 0,
        };
      }
    }

    const thisYear = new Date().getFullYear();

    totalSales.forEach((order) => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      const label = String(date.getMonth());
      if (!expectedData[label]) return;
      const totalPrice = Number(order.totalPrice) || 0;
      if (date.getFullYear() === thisYear) {
        expectedData[label].thisYearSales += totalPrice;
        expectedData[label].thisYearOrders++;
        expectedData[label].thisYearItemsSales += order.items.length;
      } else {
        expectedData[label].lastYearSales += totalPrice;
        expectedData[label].lastYearOrders++;
        expectedData[label].lastYearItemsSales += order.items.length;
      }
    });

    const data = Object.values(expectedData).map((e) =>{
      e.thisYearSales = Number(e.thisYearSales.toFixed(2));
      e.lastYearSales = Number(e.lastYearSales.toFixed(2));
      return e;
    });

    const totalLastYearOrders = totalSalesLastYear._count.id || 0;
    const totalLastYearSales = totalSalesLastYear._sum.totalPrice || 0;

    const totalThisYearOrders = totalSalesThisYear._count.id || 0;
    const totalThisYearSales = totalSalesThisYear._sum.totalPrice || 0;

    const totalItemsSales = data.reduce((acc, cur) =>{
      acc.lastYear += cur.lastYearItemsSales;
      acc.thisYear += cur.thisYearItemsSales;
      return acc;
    },{
      lastYear: 0,
      thisYear: 0, 
      compareGrowth: 0
    })
    totalItemsSales.compareGrowth = totalItemsSales.lastYear === 0
    ? (totalItemsSales.thisYear > 0 ? 1: 0) 
    : ((totalItemsSales.thisYear - totalItemsSales.lastYear) / totalItemsSales.lastYear);


    const compareSalesGrowth =
      totalLastYearSales === 0
        ? totalThisYearSales > 0
          ? 1
          : 0
        : (totalThisYearSales - totalLastYearSales) / totalLastYearSales;

    const compareOrdersGrowth =
      totalLastYearOrders === 0
        ? totalThisYearOrders > 0
          ? 1
          : 0
        : (totalThisYearOrders - totalLastYearOrders) / totalLastYearOrders;

    return res.status(200).json({
      data,
      totalOrders: {
        thisYear: totalThisYearOrders,
        lastYear: totalLastYearOrders,
        compareGrowth:compareOrdersGrowth,
      },
      totalSales: {
        thisYear: totalThisYearSales,
        lastYear: totalLastYearSales,
        compareGrowth:compareSalesGrowth,
      },
      totalItemsSales
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      message: "Failed to fetch orders Charts data",
      error,
    });
  }
};
