import { motion } from "framer-motion";

const GlowCardWrapper = ({ children, className = "" }) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`group relative ${className}`}
    >
      <div className="pointer-events-none absolute -inset-px rounded-[1.15rem] bg-gradient-to-br from-primary-500/0 via-emerald-400/0 to-cyan-400/0 opacity-0 blur transition duration-300 group-hover:from-primary-500/35 group-hover:via-emerald-400/20 group-hover:to-cyan-400/30 group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </motion.div>
  );
};

export default GlowCardWrapper;
