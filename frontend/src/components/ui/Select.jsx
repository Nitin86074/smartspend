const Select = ({ children, error, label, className = "", ...props }) => {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
      <select
        className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 ${
          error ? "border-red-300 focus:ring-red-500" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span className="mt-1.5 block text-xs font-medium text-red-500">
          {error}
        </span>
      )}
    </label>
  );
};

export default Select;
