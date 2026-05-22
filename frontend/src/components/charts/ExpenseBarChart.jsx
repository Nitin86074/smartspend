import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ExpenseBarChart = ({ data = [] }) => {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "var(--chart-tooltip-bg)",
            borderColor: "var(--chart-tooltip-border)",
            color: "var(--chart-tooltip-text)",
            borderRadius: 14,
          }}
          labelStyle={{ color: "var(--chart-tooltip-text)" }}
        />
        <Bar dataKey="amount" fill="#4f46e5" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ExpenseBarChart;
