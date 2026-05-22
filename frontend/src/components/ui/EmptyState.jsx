import { Inbox } from "lucide-react";
import Button from "./Button";

const EmptyState = ({
  actionLabel,
  className = "",
  description = "There is nothing to show yet.",
  icon: Icon = Inbox,
  onAction,
  title = "No data found",
  tone = "primary",
}) => {
  const tones = {
    primary:
      "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300",
    green:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
    red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300",
    yellow:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
  };

  return (
    <div
      className={`flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${tones[tone]}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500 dark:text-gray-400">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
