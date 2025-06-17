import { motion } from "framer-motion";
import { SparklesIcon } from "lucide-react";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <SparklesIcon size={32} />
        </p>
        <p className="text-sm">
          Unlock the potential of your data with our natural query platform.
          Seamlessly generate graphs, tables, and visualizations by simply using
          conversational prompts. No technical expertise is required—just ask
          and explore your data intuitively.
        </p>
      </div>
    </motion.div>
  );
};
