import { motion } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";

const AIInsight = ({
  title = "AI spending insight",
  message = "SmartSpend will surface stronger suggestions as you add more income, expenses, and budget activity.",
  badge = "AI signal",
  icon: Icon = Brain,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="premium-card relative overflow-hidden p-5"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.18),transparent_34%),linear-gradient(135deg,rgba(16,185,129,0.08),transparent_45%)]" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/25"
          >
            <Icon className="h-6 w-6" />
          </motion.div>
          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-200">
              <Sparkles className="h-3.5 w-3.5" />
              {badge}
            </p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
              {message}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default AIInsight;
