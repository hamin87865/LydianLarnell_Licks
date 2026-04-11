type AgreementRowProps = {
  checked: boolean;
  label: string;
  onToggle: () => void;
  onDetail?: () => void;
  isAll?: boolean;
  noBorder?: boolean;
};

export function AgreementRow({
  checked,
  label,
  onToggle,
  onDetail,
  isAll = false,
  noBorder = false,
}: AgreementRowProps) {
  return (
    <div
      className={[
        "flex items-center justify-between px-4 py-4",
        noBorder ? "" : "border-b border-white/10",
      ].join(" ")}
    >
      <label className="flex flex-1 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-5 w-5 accent-white"
        />
        <span className={isAll ? "font-semibold text-white" : "text-white/90"}>
          {label}
        </span>
      </label>

      {!isAll && onDetail && (
        <button
          type="button"
          onClick={onDetail}
          className="ml-3 text-lg text-white/60 transition hover:text-primary/90"
          aria-label={`${label} 상세 보기`}
        >
          &gt;
        </button>
      )}
    </div>
  );
}