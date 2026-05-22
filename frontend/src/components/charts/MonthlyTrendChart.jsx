import { motion } from "framer-motion";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "../../utils/formatCurrency";

const MonthlyTrendChart = ({ data = [] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-[280px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <defs>
          <linearGradient id="incomeLineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="expenseLineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value) => formatCurrency(value)}
          cursor={{ stroke: "rgba(99,102,241,0.24)", strokeWidth: 2 }}
          contentStyle={{
            background: "var(--chart-tooltip-bg)",
            borderColor: "var(--chart-tooltip-border)",
            color: "var(--chart-tooltip-text)",
            borderRadius: 14,
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.18)",
          }}
          labelStyle={{ color: "var(--chart-tooltip-text)" }}
        />
        <Line
          type="monotone"
          dataKey="income"
          name="Income"
          stroke="url(#incomeLineGradient)"
          strokeWidth={3}
          dot={false}
          isAnimationActive
        />
        <Line
          type="monotone"
          dataKey="expense"
          name="Expense"
          stroke="url(#expenseLineGradient)"
          strokeWidth={3}
          dot={false}
          isAnimationActive
        />
        <Legend />
      </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default MonthlyTrendChart;
