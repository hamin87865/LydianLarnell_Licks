type BottomActionBarProps = {
  currentStep: number;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
};

export function BottomActionBar({
  currentStep,
  onPrev,
  onNext,
  nextDisabled = false,
}: BottomActionBarProps) {
  return (
    <div className="flex w-full gap-3">
      {currentStep > 1 && currentStep !== 4 &&(
        <button
          type="button"
          onClick={onPrev}
          className="h-12 flex-1 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white"
        >
          이전
        </button>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className={[
          "h-12 rounded-xl text-sm font-semibold transition",
          currentStep > 1 ? "flex-1" : "w-full",
          nextDisabled
            ? "bg-white/15 text-white/40 cursor-not-allowed"
            : currentStep === 4
              ? "w-full bg-blue-500/90 text-white hover:bg-blue-500/80 disabled:bg-white/20 disabled:text-white/40"
              : "bg-white text-black hover:bg-white/90",
        ].join(" ")}
      >
        {currentStep === 4 ? "가입 완료" : "다음"}
      </button>
    </div>
  );
}