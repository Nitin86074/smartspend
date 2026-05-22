import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const colors = ["#4f46e5", "#059669", "#f59e0b", "#dc2626", "#0891b2"];

const ExpensePieChart = ({ data = [] }) => {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="name"
          innerRadius={64}
          outerRadius={104}
          paddingAngle={3}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--chart-tooltip-bg)",
            borderColor: "var(--chart-tooltip-border)",
            color: "var(--chart-tooltip-text)",
            borderRadius: 14,
          }}
          labelStyle={{ color: "var(--chart-tooltip-text)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ExpensePieChart;
