export const formatCurrency = (amount, currency = "INR") => {
  const value = Number(amount || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (amount) => {
  return new Intl.NumberFormat("en-IN").format(Number(amount || 0));
};

export const getAmountColor = (amount) => {
  if (amount > 0) return "text-emerald-600 dark:text-emerald-400";
  if (amount < 0) return "text-red-600 dark:text-red-400";
  return "text-gray-600 dark:text-gray-400";
};
