import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAdminSettlements, fetchMySettlement, markSettlementPaid, triggerSettlementResync, type SettlementSummary } from "@/lib/appApi";

type MonthCursor = { year: number; month: number };

function getCurrentCursor(): MonthCursor {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function getPreviousCursor(cursor: MonthCursor): MonthCursor {
  if (cursor.month === 1) return { year: cursor.year - 1, month: 12 };
  return { year: cursor.year, month: cursor.month - 1 };
}

function getNextCursor(cursor: MonthCursor): MonthCursor {
  if (cursor.month === 12) return { year: cursor.year + 1, month: 1 };
  return { year: cursor.year, month: cursor.month + 1 };
}

function isSameCursor(a: MonthCursor, b: MonthCursor) {
  return a.year === b.year && a.month === b.month;
}

function formatWon(amount: number) {
  return `${Math.round(amount || 0).toLocaleString("ko-KR")}원`;
}

function getStatusTone(status: "pending" | "paid") {
  if (status === "paid") {
    return {
      border: "border-emerald-500/40",
      background: "bg-emerald-500/5",
      statusText: "text-emerald-400",
    };
  }

  return {
    border: "border-red-500/40",
    background: "bg-red-500/5",
    statusText: "text-red-400",
  };
}

function SummaryHeader() {
  return (
    <div className="hidden md:grid grid-cols-[1.4fr_0.9fr_1fr_0.8fr] gap-4 px-4 py-3 text-xs font-semibold text-gray-400 border-b border-white/10">
      <div>이름(닉네임)</div>
      <div>합계금액</div>
      <div>계좌정보(일부)</div>
      <div>지급상태</div>
    </div>
  );
}

function NameBlock({ settlement }: { settlement: SettlementSummary }) {
  const realName = settlement.realName || settlement.name;
  const nickname = settlement.nickname?.trim();
  const hasNickname = nickname && nickname !== realName;

  return (
    <div className="min-w-0">
      <div className="text-xs text-gray-500 md:hidden mb-1">이름(닉네임)</div>
      <div className="truncate text-sm font-semibold text-white">{realName}</div>
      {hasNickname ? <div className="truncate text-xs text-blue-400 mt-1">{nickname}</div> : null}
    </div>
  );
}

function SettlementCard({
  settlement,
  expanded,
  showFullAccount,
  onToggleAccount,
  onToggle,
  isAdmin,
  onMarkPaid,
  paying,
}: {
  settlement: SettlementSummary;
  expanded: boolean;
  showFullAccount: boolean;
  onToggleAccount: () => void;
  onToggle: () => void;
  isAdmin: boolean;
  onMarkPaid: (settlement: SettlementSummary) => Promise<void>;
  paying: boolean;
}) {
  const tone = getStatusTone(settlement.status);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
      className={`rounded-xl border ${tone.border} ${tone.background} transition-all duration-200 overflow-hidden cursor-pointer`}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_0.9fr_1fr_0.8fr_28px] gap-3 items-center px-4 py-4">
        <NameBlock settlement={settlement} />
        <div>
          <div className="text-xs text-gray-500 md:hidden mb-1">합계금액</div>
          <div className="text-sm text-white font-medium">{formatWon(settlement.totalAmount)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 md:hidden mb-1">계좌정보(일부)</div>
          <div className="text-sm text-white">{settlement.maskedAccount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 md:hidden mb-1">지급상태</div>
          <div className={`text-sm font-semibold ${tone.statusText}`}>{settlement.statusLabel}</div>
        </div>
        <div className="flex md:justify-end justify-start">
          <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform ${expanded ? "rotate-180" : "rotate-0"}`} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10">
          <div className="px-4 py-4">
            <div className="grid grid-cols-[1.45fr_0.85fr_0.55fr_0.95fr] gap-3 text-xs font-semibold text-gray-400 pb-3">
              <div>제목</div>
              <div>가격</div>
              <div>건수</div>
              <div>소계금액</div>
            </div>
            <div className="space-y-3">
              {settlement.items.map((item) => (
                <div key={item.contentId} className="grid grid-cols-[1.45fr_0.85fr_0.55fr_0.95fr] gap-3 text-sm text-white">
                  <div className="truncate">{item.title}</div>
                  <div>{formatWon(item.price)}</div>
                  <div>{item.count}</div>
                  <div>{formatWon(item.subtotal)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 px-4 py-4">
            <div className="text-sm font-semibold text-white mb-3">비용정산(8:2)</div>
            {isAdmin ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">지급비용</span>
                  <span className="font-semibold text-red-400">{formatWon(settlement.payoutAmount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">수입</span>
                  <span className="font-semibold text-emerald-400">{formatWon(settlement.platformRevenue)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">입금비용</span>
                  <span className="font-semibold text-emerald-400">{formatWon(settlement.payoutAmount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">수수료</span>
                  <span className="font-semibold text-red-400">{formatWon(settlement.platformRevenue)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 px-4 py-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-sm font-semibold text-white">계좌정보</div>
              {isAdmin ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleAccount();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10"
                >
                  {showFullAccount ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showFullAccount ? "전체 숨기기" : "전체 보기"}
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs font-semibold text-gray-400 pb-3">
              <div>예금주</div>
              <div>은행</div>
              <div>{showFullAccount || !isAdmin ? "계좌정보(전체)" : "계좌정보(일부)"}</div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-white break-all">
              <div>{settlement.account.accountHolder}</div>
              <div>{settlement.account.bankName}</div>
              <div>{showFullAccount || !isAdmin ? settlement.account.accountNumber : settlement.maskedAccount}</div>
            </div>
          </div>

          {isAdmin && (
            <div className="border-t border-white/10 px-4 py-4 flex justify-end">
              <button
                type="button"
                disabled={settlement.status === "paid" || paying}
                onClick={async (event) => {
                  event.stopPropagation();
                  await onMarkPaid(settlement);
                }}
                className="h-11 rounded-xl px-5 text-sm font-semibold bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paying ? "처리 중..." : settlement.status === "paid" ? "지급완료" : "지급완료 처리"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettlementMenu() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const currentCursor = useMemo(() => getCurrentCursor(), []);
  const [cursor, setCursor] = useState<MonthCursor>(currentCursor);
  const [settlements, setSettlements] = useState<SettlementSummary[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleAccountIds, setVisibleAccountIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [resyncing, setResyncing] = useState(false);
  const [error, setError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("");

  const isAdmin = user?.role === "admin";
  const isMusician = user?.role === "musician";

  const loadSettlements = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setLoading(true);
      setError("");

      if (isAdmin) {
        const response = await fetchAdminSettlements(cursor.year, cursor.month);
        setSettlements(response.settlements || []);
      } else {
        const response = await fetchMySettlement(cursor.year, cursor.month);
        setSettlements(response.settlement ? [response.settlement] : []);
      }

      setLastSyncedAt(new Date().toLocaleString("ko-KR"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "정산내역을 불러오지 못했습니다.";
      setError(message);
      setSettlements([]);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!isAdmin && !isMusician) {
      navigate("/mypage");
    }
  }, [isAuthenticated, isAdmin, isMusician, navigate]);

  useEffect(() => {
    if (!user || (!isAdmin && !isMusician)) return;
    void loadSettlements();
  }, [user, isAdmin, isMusician, cursor.year, cursor.month]);

  useEffect(() => {
    if (!settlements.some((item) => item.musicianUserId === expandedId)) {
      setExpandedId(null);
    }
  }, [settlements, expandedId]);

  const canGoNext = !isSameCursor(cursor, currentCursor);

  const handleMarkPaid = async (settlement: SettlementSummary) => {
    if (!isAdmin || settlement.status === "paid") return;

    try {
      setPayingId(settlement.musicianUserId);
      const response = await markSettlementPaid(settlement.musicianUserId, cursor.year, cursor.month);
      toast.success(`${response.settlement.realName || response.settlement.name} 지급완료 처리가 반영되었습니다.`);
      await loadSettlements({ silent: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "지급완료 처리에 실패했습니다.";
      setError(message);
      toast.error(message);
    } finally {
      setPayingId(null);
    }
  };

  const handleManualResync = async () => {
    if (!isAdmin) return;

    try {
      setResyncing(true);
      setError("");
      const response = await triggerSettlementResync(cursor.year, cursor.month);
      setSettlements(response.settlements || []);
      setLastSyncedAt(new Date().toLocaleString("ko-KR"));
      toast.success("관리자 수동 재동기화가 완료되었습니다.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "수동 재동기화에 실패했습니다.";
      setError(message);
      toast.error(message);
    } finally {
      setResyncing(false);
    }
  };

  if (!user || (!isAdmin && !isMusician)) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-32 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="container mx-auto max-w-6xl px-6"
      >
        <div className="rounded-xl border border-white/10 bg-card/50 p-6 md:p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col gap-4 pb-6 border-b border-white/10 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center justify-center gap-4 text-white text-xl md:text-2xl font-bold">
              <button
                type="button"
                onClick={() => setCursor((prev) => getPreviousCursor(prev))}
                className="p-1 text-gray-300 hover:text-white transition-colors"
                aria-label="이전 달"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>{cursor.year}년 {cursor.month}월 정산내역</div>
              <button
                type="button"
                onClick={() => setCursor((prev) => getNextCursor(prev))}
                disabled={!canGoNext}
                className="p-1 text-gray-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="다음 달"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              {lastSyncedAt ? <div className="text-xs text-gray-400">최근 동기화 {lastSyncedAt}</div> : null}
              {isAdmin ? (
                <button
                  type="button"
                  onClick={handleManualResync}
                  disabled={resyncing}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${resyncing ? "animate-spin" : ""}`} />
                  {resyncing ? "재동기화 중..." : "수동 재동기화"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6">
            <SummaryHeader />

            <div className="space-y-4 pt-4">
              {loading ? (
                <div className="rounded-xl border border-white/10 bg-background/40 px-4 py-8 text-center text-sm text-gray-400">불러오는 중...</div>
              ) : settlements.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-background/40 px-4 py-8 text-center text-sm text-gray-400">정산내역 없음</div>
              ) : (
                settlements.map((settlement) => (
                  <SettlementCard
                    key={settlement.musicianUserId}
                    settlement={settlement}
                    expanded={expandedId === settlement.musicianUserId}
                    showFullAccount={!!visibleAccountIds[settlement.musicianUserId]}
                    onToggleAccount={() => setVisibleAccountIds((prev) => ({ ...prev, [settlement.musicianUserId]: !prev[settlement.musicianUserId] }))}
                    onToggle={() => setExpandedId((prev) => (prev === settlement.musicianUserId ? null : settlement.musicianUserId))}
                    isAdmin={isAdmin}
                    onMarkPaid={handleMarkPaid}
                    paying={payingId === settlement.musicianUserId}
                  />
                ))
              )}
            </div>

            {error ? <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}
          </div>
        </div>
      </motion.div>
    </main>
  );
}
