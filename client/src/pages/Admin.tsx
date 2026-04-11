import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  approveApplication,
  deleteMusicianByAdmin,
  fetchAdminAuditLogs,
  fetchAdminDashboard,
  fetchAdminPaymentOrders,
  getAdminContractDownloadUrl,
  rejectApplication,
  type AdminAuditLog,
  type AdminPaymentOrder,
  type MusicianApplication,
  type PaymentAuditLog,
  type UserSettings,
} from "@/lib/appApi";
import { ADMIN_FEATURE_FLAGS } from "@/config/adminFlags";

interface ContentItem {
  id: string;
  authorId: string;
  isSanctioned?: boolean;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR");
}

function maskAccountPreview(bankName?: string, accountNumber?: string) {
  if (!bankName && !accountNumber) return "-";
  return [bankName, accountNumber].filter(Boolean).join(" / ");
}


export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [applications, setApplications] = useState<MusicianApplication[]>([]);
  const [processedApplications, setProcessedApplications] = useState<MusicianApplication[]>([]);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [expandedProcessed, setExpandedProcessed] = useState<string | null>(null);
  const [allSettings, setAllSettings] = useState<Record<string, UserSettings>>({});
  const [allContents, setAllContents] = useState<ContentItem[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<AdminPaymentOrder[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminAuditLog[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [memoDrafts, setMemoDrafts] = useState<Record<string, string>>({});
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});

  const loadData = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setLoading(true);
      const [dashboard, audit, orders] = await Promise.all([
        fetchAdminDashboard(),
        fetchAdminAuditLogs(),
        fetchAdminPaymentOrders(),
      ]);

      setApplications(dashboard.applications);
      setProcessedApplications(dashboard.processedApplications);
      setAllSettings(dashboard.settings);
      setAllContents(dashboard.contents);
      setAdminLogs(audit.adminLogs || []);
      setPaymentLogs(audit.paymentLogs || []);
      setPaymentOrders(orders.orders || []);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      navigate("/");
      return;
    }

    void loadData();
  }, [isAuthenticated, navigate, user?.role]);

  const getDisplayNickname = (userId: string, fallback: string) => {
    return allSettings[userId]?.nickname || fallback;
  };

  const getSanctionedCount = (userId: string) => {
    return allContents.filter((content) => content.authorId === userId && content.isSanctioned).length;
  };

  const sortedProcessedApplications = useMemo(() => {
    const copied = [...processedApplications];

    copied.sort((a, b) => {
      const aSanctionCount = getSanctionedCount(a.userId);
      const bSanctionCount = getSanctionedCount(b.userId);
      const aPriority = aSanctionCount >= 2 ? 1 : 0;
      const bPriority = bSanctionCount >= 2 ? 1 : 0;

      if (aPriority !== bPriority) return bPriority - aPriority;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return copied;
  }, [processedApplications, allContents]);

  const approveRequest = async (app: MusicianApplication) => {
    try {
      setActioningId(app.id);
      await approveApplication(app.id, { adminMemo: memoDrafts[app.id] || undefined }, user?.id);
      toast.success(`${app.name} 승인 처리가 완료되었습니다.`);
      await loadData({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "승인 처리에 실패했습니다.");
    } finally {
      setActioningId(null);
    }
  };

  const rejectRequest = async (app: MusicianApplication) => {
    const reason = (reasonDrafts[app.id] || "").trim();
    if (!reason) {
      toast.error("거절 사유를 입력해야 합니다.");
      return;
    }

    try {
      setActioningId(app.id);
      await rejectApplication(app.id, { reason, adminMemo: memoDrafts[app.id] || undefined }, user?.id);
      toast.success(`${app.name} 거절 처리가 완료되었습니다.`);
      await loadData({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "거절 처리에 실패했습니다.");
    } finally {
      setActioningId(null);
    }
  };

  const deleteMusicianAccount = async (app: MusicianApplication) => {
    try {
      setActioningId(app.id);
      await deleteMusicianByAdmin(app.userId);
      toast.success(`${app.name} 계정 삭제가 반영되었습니다.`);
      await loadData({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "계정 삭제에 실패했습니다.");
    } finally {
      setActioningId(null);
    }
  };

  const renderApplicationCard = (app: MusicianApplication, expanded: boolean, onToggle: () => void, processed = false) => {
    const displayNickname = getDisplayNickname(app.userId, app.nickname);
    const sanctionedCount = getSanctionedCount(app.userId);
    const isPriorityMusician = sanctionedCount >= 2;
    const isActioning = actioningId === app.id;

    return (
      <div key={app.id} className={`bg-background rounded-lg overflow-hidden border ${isPriorityMusician ? "border-red-500/50" : "border-white/10"}`}>
        <div className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${isPriorityMusician ? "hover:bg-red-500/5" : "hover:bg-white/5"}`} onClick={onToggle}>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-lg">
              {app.name}{" "}
              <span onClick={(e) => { e.stopPropagation(); navigate(`/musician-profile/${app.userId}`); }} className={`text-sm font-normal cursor-pointer hover:underline ${processed && isPriorityMusician ? "text-red-300" : "text-blue-500"}`}>
                ({displayNickname})
              </span>
            </h3>
            <p className="text-white text-sm font-semibold mt-1">지원 분야: {app.category}</p>
          </div>

          <div className="flex items-center gap-4">
            {processed ? (
              <>
                <p className={`text-sm font-semibold ${isPriorityMusician ? "text-red-300" : "text-white"}`}>제재 영상 개수: {sanctionedCount}개</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${app.status === "approved" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{app.status === "approved" ? "승인완료" : "거절"}</span>
              </>
            ) : null}
            <div className="text-sm text-gray-400">{expanded ? "접기 ▲" : "지원서 확인 ▼"}</div>
          </div>
        </div>

        {expanded && (
          <div className="p-4 border-t border-white/10 bg-black/20 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500 mb-1">이름</p><p className="text-white text-sm">{app.name}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">닉네임</p><p className="text-white text-sm">{displayNickname}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">카테고리</p><p className="text-white text-sm">{app.category}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">이메일</p><p className="text-white text-sm">{app.email}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">은행</p><p className="text-white text-sm">{app.bankName || "-"}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">계좌정보(일부)</p><p className="text-white text-sm">{maskAccountPreview(app.bankName, app.accountNumber)}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">예금주명</p><p className="text-white text-sm">{app.accountHolder || "-"}</p></div>
              {processed ? <div><p className="text-xs text-gray-500 mb-1">제재 영상 개수</p><p className={`${isPriorityMusician ? "text-red-300" : "text-white"} text-sm font-semibold`}>{sanctionedCount}개</p></div> : null}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">지원 영상</p>
              {app.videoPath ? (
                <video controls className="w-full max-h-64 bg-black rounded" src={app.videoPath} />
              ) : (
                <div className="p-4 bg-gray-800 rounded flex flex-col items-center justify-center text-center">
                  <p className="text-gray-300 text-sm mb-1">{app.videoFileName}</p>
                  <p className="text-gray-500 text-xs mt-2">영상 경로가 없습니다.</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">계약서</p>
              {app.signedContractPath ? (
                <a href={getAdminContractDownloadUrl(app.id)} download={app.signedContractFileName || "signed-contract.pdf"} className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-blue-300 hover:bg-white/10 transition-colors">
                  계약서 다운로드{app.signedContractFileName ? ` (${app.signedContractFileName})` : ""}
                </a>
              ) : <p className="text-gray-400 text-sm">계약서 없음</p>}
            </div>

            {!processed ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500 mb-2">거절 사유</p>
                  <textarea
                    value={reasonDrafts[app.id] ?? app.rejectedReason ?? ""}
                    onChange={(e) => setReasonDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))}
                    className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
                    placeholder="거절 시 사용자에게 남길 사유를 입력하세요."
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">관리자 메모</p>
                  <textarea
                    value={memoDrafts[app.id] ?? app.adminMemo ?? ""}
                    onChange={(e) => setMemoDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))}
                    className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
                    placeholder="내부용 메모를 남길 수 있습니다."
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500 mb-2">거절 사유</p>
                  <div className="min-h-24 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white whitespace-pre-wrap">{app.rejectedReason || "-"}</div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">관리자 메모</p>
                  <div className="min-h-24 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white whitespace-pre-wrap">{app.adminMemo || "-"}</div>
                </div>
              </div>
            )}

            {!processed ? (
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Button disabled={isActioning} onClick={() => approveRequest(app)} className="flex-1 bg-green-600 hover:bg-green-500/90 text-white font-bold py-2 rounded transition-colors">{isActioning ? "처리 중..." : "승인"}</Button>
                <Button disabled={isActioning} onClick={() => rejectRequest(app)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded transition-colors">{isActioning ? "처리 중..." : "거절"}</Button>
              </div>
            ) : isPriorityMusician ? (
              <div className="pt-4 border-t border-white/10 mt-4">
                <Button disabled={isActioning} onClick={() => deleteMusicianAccount(app)} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded transition-colors">{isActioning ? "처리 중..." : "계정 삭제"}</Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <main className="min-h-screen bg-background text-foreground pt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-6 max-w-5xl pb-12"
      >
        <div className="bg-card border border-white/10 rounded-lg p-8">
          <div className="flex items-center justify-between gap-4 mb-8">
            <h1 className="text-4xl font-display font-bold text-white">관리자 대시보드</h1>
            <Button onClick={() => void loadData()} className="rounded-xl bg-white/10 text-white hover:bg-white/15">새로고침</Button>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-4">뮤지션 지원서 관리</h2>
              {loading ? (
                <div className="bg-background rounded p-4 text-gray-400">불러오는 중...</div>
              ) : applications.length === 0 ? (
                <div className="bg-background rounded p-4 text-gray-400">대기 중인 지원서가 없습니다.</div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => renderApplicationCard(app, expandedApp === app.id, () => setExpandedApp(expandedApp === app.id ? null : app.id)))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">뮤지션 관리</h2>
              {sortedProcessedApplications.length === 0 ? (
                <div className="bg-background rounded p-4 text-gray-400">처리된 뮤지션 내역이 없습니다.</div>
              ) : (
                <div className="space-y-4">
                  {sortedProcessedApplications.map((app) => renderApplicationCard(app, expandedProcessed === app.id, () => setExpandedProcessed(expandedProcessed === app.id ? null : app.id), true))}
                </div>
              )}
            </section>

            {ADMIN_FEATURE_FLAGS.showPaymentHistorySection ? (
              <section>
                <h2 className="text-2xl font-bold mb-4">결제 이력</h2>
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <div className="grid grid-cols-[1.2fr_0.7fr_0.8fr_1fr] gap-3 bg-white/5 px-4 py-3 text-xs font-semibold text-gray-400">
                    <div>주문명</div><div>금액</div><div>상태</div><div>생성시각</div>
                  </div>
                  <div className="divide-y divide-white/10">
                    {paymentOrders.slice(0, 10).map((order) => (
                      <div key={order.orderId} className="grid grid-cols-[1.2fr_0.7fr_0.8fr_1fr] gap-3 px-4 py-3 text-sm text-white">
                        <div className="truncate">{order.orderName}</div>
                        <div>{Math.round(order.amount).toLocaleString("ko-KR")}원</div>
                        <div>{order.status}</div>
                        <div>{formatDateTime(order.createdAt)}</div>
                      </div>
                    ))}
                    {paymentOrders.length === 0 ? <div className="px-4 py-6 text-sm text-gray-400">결제 이력이 없습니다.</div> : null}
                  </div>
                </div>
              </section>
            ) : null}

            {ADMIN_FEATURE_FLAGS.showAuditHistorySection ? (
              <section>
                <h2 className="text-2xl font-bold mb-4">관리자/결제 감사 이력</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 p-4 bg-background/50">
                    <h3 className="text-lg font-semibold text-white mb-3">관리자 이력</h3>
                    <div className="space-y-3 max-h-80 overflow-auto">
                      {adminLogs.slice(0, 20).map((log) => (
                        <div key={log.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <div className="text-sm font-semibold text-white">{log.action_type}</div>
                          <div className="text-xs text-gray-400 mt-1">{log.target_type} / {log.target_id || "-"}</div>
                          <div className="text-xs text-gray-500 mt-1">{formatDateTime(log.created_at)}</div>
                          {log.reason ? <div className="text-xs text-red-300 mt-2 whitespace-pre-wrap">사유: {log.reason}</div> : null}
                        </div>
                      ))}
                      {adminLogs.length === 0 ? <div className="text-sm text-gray-400">관리자 이력이 없습니다.</div> : null}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 p-4 bg-background/50">
                    <h3 className="text-lg font-semibold text-white mb-3">결제 이력 로그</h3>
                    <div className="space-y-3 max-h-80 overflow-auto">
                      {paymentLogs.slice(0, 20).map((log) => (
                        <div key={log.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <div className="text-sm font-semibold text-white">{log.action_type}</div>
                          <div className="text-xs text-gray-400 mt-1">상태: {log.status}</div>
                          <div className="text-xs text-gray-500 mt-1">{formatDateTime(log.created_at)}</div>
                        </div>
                      ))}
                      {paymentLogs.length === 0 ? <div className="text-sm text-gray-400">결제 로그가 없습니다.</div> : null}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </motion.div>
    </main>
  );
}
