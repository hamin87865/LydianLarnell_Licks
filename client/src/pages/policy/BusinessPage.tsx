export default function BusinessInfoPage() {
  const sectionClassName =
    "rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-7";
  const titleClassName = "text-xl font-semibold text-white md:text-2xl";
  const tableClassName =
    "w-full border-collapse text-sm text-gray-300 md:text-base";
  const thClassName =
    "w-1/3 border-b border-white/10 py-3 text-left font-medium text-white";
  const tdClassName =
    "border-b border-white/10 py-3 text-gray-300";

  return (
    <div className="min-h-screen bg-black px-6 py-12 text-white md:px-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          사업자 정보
        </h1>

        <p className="mb-10 text-sm leading-7 text-white/60 md:text-base">
        </p>

        <section className={sectionClassName}>
          <h2 className={`mb-6 ${titleClassName}`}>
            통신판매사업자 정보
          </h2>

          <table className={tableClassName}>
            <tbody>
              <tr>
                <th className={thClassName}>상호</th>
                <td className={tdClassName}>
                  리디안 라넬(Lydian Larnell)
                </td>
              </tr>
              <tr>
                <th className={thClassName}>대표자명</th>
                <td className={tdClassName}>
                  강신우
                </td>
              </tr>
              <tr>
                <th className={thClassName}>사업자 등록번호</th>
                <td className={tdClassName}>237-11-03075</td>
              </tr>
              <tr>
                <th className={thClassName}>판매방식</th>
                <td className={tdClassName}>인터넷</td>
              </tr>
              <tr>
                <th className={thClassName}>사업장 소재지</th>
                <td className={tdClassName}>
                  경상남도 김해시 월산로 82-62 102동 1603호
                  (부곡동, 석봉마을 대동아파트)
                </td>
              </tr>
              <tr>
                <th className={thClassName}>신고일자</th>
                <td className={tdClassName}>2026.03.26</td>
              </tr>
              <tr>
                <th className={thClassName}>법인 여부</th>
                <td className={tdClassName}>개인</td>
              </tr>
              <tr>
                <th className={thClassName}>취급 품목</th>
                <td className={tdClassName}>PDF 파일</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}