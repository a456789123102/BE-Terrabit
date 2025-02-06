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
        const label = `Week ${Math.ceil(
          currentDate.getDate() / 7
        )} (${currentDate.getFullYear()}-${String(
          currentDate.getMonth() + 1
        ).padStart(2, "0")})`;
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

    // จัดกลุ่มข้อมูลจาก `orders`
    const groupedData = orders.reduce(
      (acc, order) => {
        const date = new Date(order.createdAt);
        const label =
          interval === "daily"
            ? date.toISOString().split("T")[0]
            : interval === "weekly"
            ? `Week ${Math.ceil(
                date.getDate() / 7
              )} (${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                2,
                "0"
              )})`
            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                2,
                "0"
              )}-01`;
        acc[label].totalOrders += 1;
        if (
          [
            "awaiting_slip_upload",
            "awaiting_confirmation",
            "awaiting_rejection",
          ].includes(order.status)
        ) {
          acc[label].pending += 1;
        } else if (order.status === "order_approved") {
          acc[label].success += 1;
        } else if (
          ["order_rejected", "order_cancelled"].includes(order.status)
        ) {
          acc[label].rejected += 1;
        }

        return acc;
      },
      { ...expectedData }
    );

    // แปลง `groupedData` เป็น `result` และเรียงตามลำดับเวลา
    const result = Object.values(groupedData); // ✅ แปลง Object เป็น Array โดยไม่ sort

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
            )}`; // เปลี่ยนให้ตรงกับ `startDate`

      // ✅ เปลี่ยน `result[0].label` ให้ตรงกับ `expectedStartLabel`
      result[0] = { ...result[0], label: expectedStartLabel };
    }

    return res.status(200).json(result);
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

    // ดึงข้อมูลคำสั่งซื้อ
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: "order_approved",
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
        const label = `Week ${Math.ceil(
          currentDate.getDate() / 7
        )} (${currentDate.getFullYear()}-${String(
          currentDate.getMonth() + 1
        ).padStart(2, "0")})`;
        expectedData[label] = { label, total: 0 };
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
            ? `Week ${Math.ceil(
                date.getDate() / 7
              )} (${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                2,
                "0"
              )})`
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

    // แปลง `groupedData` เป็น `result` และเรียงตามลำดับเวลา
    const result = Object.values(groupedData).sort((a, b) =>
      a.label.localeCompare(b.label)
    );

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
    const TotalIncomes = result.reduce((acc, cur) => acc + cur.total, 0);
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
    const interval = (req.query.interval as string) || "monthly";
    const length = Number(req.query.length) || 10;
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
        maxEndDate.setMonth(maxEndDate.getMonth() + 7);
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

    const topSellerItems = await prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      _sum: {
        quantity: true, // รวมจำนวนสินค้าที่ขายได้
        price: true, // รวมยอดขายของสินค้านั้น ๆ
      },
      where: {
        order: {
          status: "order_approved", // นับเฉพาะออเดอร์ที่ถูกอนุมัติ
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        _sum: {
          quantity: "desc", // เรียงจากสินค้าที่ขายดีที่สุด
        },
      },
      take: length, // ดึง Top 10 สินค้าขายดี
    });

    const formattedData = topSellerItems.map((item) => ({
      label: item.productName,
      quantity: item._sum.quantity,
      total: item._sum.price,
    }));
    return res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch orders Charts data", error });
  }
};
////////////////////////////////////////////////////////////////////////////
export const getWeeklySaleForCharts = async (req: Request, res: Response) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7 * 24); // 6 สัปดาห์ย้อนหลัง
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(); // วันนี้
    endDate.setHours(23, 59, 59, 999);

    const weeklySalesData = await prisma.order.findMany({
      where: {
        status: "order_approved",
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
        status: "order_approved",
      },
      _count: {
        id: true, // นับจำนวน order
      },
      _sum: {
        totalPrice: true, // รวมยอดขายทั้งหมด
      },
    });

    //เปลี่ยนเป็น Reports

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
      date.setDate(date.getDate() + 1);
      if (!expectedData[label]) {
        expectedData[label] = {
          label: `Week ${label}`,
          totalOrders: 0,
          totalIncome: 0,
        };
      }
      date.setDate(date.getDate() + 7);
    }

    const groupedData = weeklySalesData.reduce(
      (acc, order) => {
        const date = new Date(order.createdAt);
        const label = `${String(getWeekNumber(date)).padStart(
          2,
          "0"
        )}-${date.getFullYear()}`;
        acc[label].totalOrders++;
        acc[label].totalIncome += order.totalPrice || 0;
        return acc;
      },
      { ...expectedData }
    );
    const data = Object.values(groupedData);
    const totalOrders = totalSalesData._count.id || 0;
    const LastWowOrders = data.length < 2 ? 0 : data[data.length - 2].totalOrders === 0 
    ? (data[data.length - 1].totalOrders > 0 ? 1 : 0)  
    : (data[data.length - 1].totalOrders - data[data.length - 2].totalOrders) / data[data.length - 2].totalOrders; 


    const totalIncome = totalSalesData._sum.totalPrice || 0;
    const LastWowIncomes = data.length < 2 ? 0 : data[data.length - 2].totalIncome === 0 //ถ้า data.length < 2 (มีข้อมูลน้อยกว่า 2 สัปดาห์) → return 0
    ? (data[data.length - 1].totalIncome > 0 ? 1 : 0)  //ถ้าสัปดาห์ก่อน (prevIncome) เป็น 0: ถ้าสัปดาห์นี้ (lastIncome) > 0 → return 1 (100% Growth) สัปดาห์นี้ก็ 0 → return 0
    : (data[data.length - 1].totalIncome - data[data.length - 2].totalIncome) / data[data.length - 2].totalIncome; //คิดตามปกติ


    return res.status(200).json({totalOrders:totalOrders,LastWowOrders:LastWowOrders,totalIncome:totalIncome,LastWowIncomes:LastWowIncomes,data:data});
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch orders Charts data", error });
  }
};
