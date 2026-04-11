import { motion } from "framer-motion";

type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const progressPercent =
    totalSteps <= 1 ? 0 : ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full">
      <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-white"
          animate={{ width: `${progressPercent}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
        />
      </div>
    </div>
  );
}