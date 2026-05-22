import { Plus } from "lucide-react";

const FAB = ({
  icon: Icon = Plus,
  label = "Quick action",
  onClick = () => console.log("SmartSpend FAB clicked"),
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-24 right-5 z-30 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7C3AED_0%,#4F46E5_100%)] text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all duration-300 hover:-translate-y-1 hover:opacity-90 focus-visible:ring-primary-500 lg:bottom-8 lg:right-8"
      aria-label={label}
      title={label}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
};

export default FAB;
