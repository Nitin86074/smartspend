const Card = ({ children, className = "", interactive = false }) => {
  return (
    <section
      className={`rounded-2xl border border-white/20 bg-white/70 shadow-card backdrop-blur-sm transition-all duration-200 dark:border-white/10 dark:bg-gray-900/70 ${
        interactive
          ? "hover:-translate-y-0.5 hover:shadow-card-hover"
          : ""
      } ${className}`}
    >
      {children}
    </section>
  );
};

export default Card;
