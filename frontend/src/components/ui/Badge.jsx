const variants = {
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  indigo:
    "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
  red: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  yellow:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const Badge = ({ children, className = "", variant = "gray" }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
