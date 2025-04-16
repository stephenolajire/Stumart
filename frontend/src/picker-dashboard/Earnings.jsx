import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./css/Earnings.module.css";

const Earnings = () => {
  const [earningsData, setEarningsData] = useState({
    total_earnings: 0,
    order_count: 0,
    average_per_order: 0,
    daily_earnings: [],
  });
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await axios.get(
          `/api/picker/earnings/?period=${period}`
        );
        setEarningsData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching earnings data:", error);
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [period]);

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Earnings</h1>
        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={period}
            onChange={handlePeriodChange}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <h3>Total Earnings</h3>
          <p>₦{earningsData.total_earnings.toFixed(2)}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Completed Orders</h3>
          <p>{earningsData.order_count}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Average Per Order</h3>
          <p>₦{earningsData.average_per_order.toFixed(2)}</p>
        </div>
      </div>

      {earningsData.daily_earnings.length > 0 && (
        <div className={styles.chart}>
          <h3 className={styles.chartTitle}>Earnings Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData.daily_earnings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`₦${value}`, "Earnings"]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="var(--primary-500)"
                strokeWidth={2}
                dot={{ fill: "var(--primary-500)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Earnings;
