import { Loader2 } from "lucide-react";

const Loader = ({ label = "Loading..." }) => {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
      <Loader2 className="h-7 w-7 animate-spin text-primary-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
};

export default Loader;
