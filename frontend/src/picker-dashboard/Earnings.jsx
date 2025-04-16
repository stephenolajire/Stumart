// src/components/PickerDashboard/Earnings/Earnings.jsx
import React, { useState, useEffect } from "react";
import styles from "./css/Earnings.module.css";
import { FaMoneyBillWave, FaBox, FaChartLine } from "react-icons/fa";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import api from "../constant/api";

const Earnings = () => {
  const [earningsData, setEarningsData] = useState({
    total_earnings: 0,
    order_count: 0,
    average_per_order: 0,
    period: "week",
    daily_earnings: [],
  });
  const [period, setPeriod] = useState("week");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        setIsLoading(true);
        // Replace with your actual API endpoint
        const response = await api.get(
          `earnings/?period=${period}`
        );
        setEarningsData(response.data);
      } catch (error) {
        console.error("Error fetching earnings data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEarningsData();
  }, [period]);

  // For demonstration purposes using mock data
  const mockWeekData = {
    total_earnings: 10500,
    order_count: 15,
    average_per_order: 700,
    period: "week",
    daily_earnings: [
      { date: "2025-04-10", amount: 2100 },
      { date: "2025-04-11", amount: 1400 },
      { date: "2025-04-12", amount: 2100 },
      { date: "2025-04-13", amount: 700 },
      { date: "2025-04-14", amount: 1400 },
      { date: "2025-04-15", amount: 2100 },
      { date: "2025-04-16", amount: 700 },
    ],
  };

  const mockMonthData = {
    total_earnings: 42000,
    order_count: 60,
    average_per_order: 700,
    period: "month",
    daily_earnings: [
      // Month data with 30 entries
      // For simplicity, just showing mock week data
      ...mockWeekData.daily_earnings,
    ],
  };

  const mockYearData = {
    total_earnings: 504000,
    order_count: 720,
    average_per_order: 700,
    period: "year",
    daily_earnings: [],
  };

  // Use mock data for now based on selected period
  let displayData;
  if (isLoading) {
    displayData =
      period === "week"
        ? mockWeekData
        : period === "month"
        ? mockMonthData
        : mockYearData;
  } else {
    displayData = earningsData;
  }

  // Format dates for chart display
  const chartData = displayData.daily_earnings.map((item) => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className={styles.earnings}>
      <h1 className={styles.pageTitle}>Earnings</h1>

      <div className={styles.periodFilters}>
        <button
          className={`${styles.periodButton} ${
            period === "week" ? styles.active : ""
          }`}
          onClick={() => setPeriod("week")}
        >
          This Week
        </button>
        <button
          className={`${styles.periodButton} ${
            period === "month" ? styles.active : ""
          }`}
          onClick={() => setPeriod("month")}
        >
          This Month
        </button>
        <button
          className={`${styles.periodButton} ${
            period === "year" ? styles.active : ""
          }`}
          onClick={() => setPeriod("year")}
        >
          This Year
        </button>
      </div>

      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaMoneyBillWave />
          </div>
          <div className={styles.statInfo}>
            <h3>₦{displayData.total_earnings.toLocaleString()}</h3>
            <p>Total Earnings</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaBox />
          </div>
          <div className={styles.statInfo}>
            <h3>{displayData.order_count}</h3>
            <p>Completed Orders</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaChartLine />
          </div>
          <div className={styles.statInfo}>
            <h3>₦{displayData.average_per_order.toLocaleString()}</h3>
            <p>Average Per Order</p>
          </div>
        </div>
      </div>

      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>Earnings Breakdown</h2>
        {period !== "year" && chartData.length > 0 ? (
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="formattedDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#666" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#666" }}
                  tickFormatter={(value) => `₦${value}`}
                />
                <Tooltip
                  formatter={(value) => [`₦${value}`, "Earnings"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--primary-500)"
                  fill="var(--primary-200)"
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={styles.noChartData}>
            No detailed earnings data available for this period.
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;
