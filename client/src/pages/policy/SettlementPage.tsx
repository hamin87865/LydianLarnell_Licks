export default function SettlementPage() {
  const sectionClassName =
    "rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-7";
  const titleClassName = "text-xl font-semibold text-white md:text-2xl";
  const bodyClassName = "text-[15px] leading-8 text-gray-300 md:text-base";
  const itemClassName = "pl-5 -indent-5";
  const subItemClassName = "pl-6 -indent-6";
  const dashItemClassName = "pl-4 -indent-4";

  return (
    <div className="min-h-screen bg-black px-6 py-12 text-white md:px-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          뮤지션 정산정책
        </h1>

        <p className="mb-10 max-w-4xl text-sm leading-7 text-white/60 md:mb-12 md:text-base">
          Lydian Larnell Licks(이하 "서비스")는 뮤지션(아티스트)이 등록한 디지털 콘텐츠의 판매에 대해 다음과 같은 정산 정책을 적용합니다.
        </p>

        <div className="space-y-5">
          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제1조 (정산 대상)</h2>
            </div>

            <div className={`${bodyClassName} space-y-3`}>
              <p className={itemClassName}>
                1. 정산 대상은 서비스 내에서 뮤지션(아티스트)이 등록한 콘텐츠가 이용자에게 유료로 판매 또는 이용되어 발생한 수익을 의미합니다.
              </p>

              <p className={itemClassName}>
                2. 정산 대상이 되는 콘텐츠의 유형은 다음과 같습니다.
              </p>
              <div className="space-y-2">
                <p className={subItemClassName}>
                  ① PDF 형태의 학습 자료 (릭 악보, 연습 자료 등 다운로드 콘텐츠)
                </p>
              </div>

              <p className={itemClassName}>
                3. 다음 각 호에 해당하는 경우에는 정산 대상에 포함되지 않습니다
              </p>
              <div className="space-y-2">
                <p className={subItemClassName}>① 무료로 제공되는 콘텐츠</p>
                <p className={subItemClassName}>② 테스트 또는 프로모션 목적으로 무상 제공된 콘텐츠</p>
                <p className={subItemClassName}>③ 환불 또는 결제 취소가 완료된 거래</p>
              </div>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제2조 (수익 배분 비율)</h2>
            </div>

            <div className={`${bodyClassName} space-y-3`}>
              <p className={itemClassName}>
                1. 콘텐츠 판매로 발생한 수익은 다음과 같이 배분됩니다.
              </p>
              <div className="space-y-2">
                <p className={subItemClassName}>① 뮤지션(아티스트): 80%</p>
                <p className={subItemClassName}>② 서비스(Lydian Larnell Licks): 20%</p>
              </div>

              <p className={itemClassName}>
                2. 제1항의 수익 배분은 이용자가 실제 결제한 금액에서 다음 각 호의 항목을 공제한 후의 금액(이하 “정산 기준 금액”)을 기준으로 적용됩니다
              </p>
              <div className="space-y-2">
                <p className={subItemClassName}>① 결제대행사(PG)사 수수료</p>
                <p className={subItemClassName}>② 부가가치세(VAT) 등 관련 세금</p>
                <p className={subItemClassName}>③ 환불 및 결제 취소 금액</p>
              </div>

              <p className={itemClassName}>
                3. 부가가치세는 별도의 표시가 없는 한 결제 금액에 포함된 것으로 간주하며, 세금은 관련 법령에 따라 처리됩니다.
              </p>
              <p className={itemClassName}>
                4. 정산 기준 금액에 대해 제1항의 비율을 적용하여 뮤지션에게 지급할 정산 금액을 산정합니다.
              </p>
              <p className={itemClassName}>
                5. 서비스는 정산 내역(정산이 된 금액, 팔린 PDF 파일 개수, 판매 된 금액 등)을 뮤지션이 확인할 수 있도록 제공합니다.
              </p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제3조 (정산 기준)</h2>
            </div>

            <div className={`${bodyClassName} space-y-3`}>
              <p className={itemClassName}>
                1. 정산은 매월 1일부터 말일까지의 판매 내역을 기준으로 집계됩니다.
              </p>

              <p className={itemClassName}>
                2. 정산 금액은 이용자가 실제 결제 완료한 금액을 기준으로 하되, 다음 각 호의 항목을 반영하여 산정합니다
              </p>
              <div className="space-y-2">
                <p className={subItemClassName}>① 부가가치세(VAT)는 별도의 표시가 없는 한 결제 금액을 기준으로 정산합니다.</p>
                <p className={subItemClassName}>② 결제대행사(PG사)의 수수료는 공제된 금액을 기준으로 정산합니다.</p>
                <p className={subItemClassName}>③ 취소 및 환불된 거래 금액은 정산 금액에서 제외됩니다.</p>
              </div>

              <p className={itemClassName}>
                3. 취소 및 환불 금액은 환불이 확정된 시점을 기준으로 해당 월의 정산 내역에 반영됩니다.
              </p>
              <p className={itemClassName}>
                4. 정산 금액은 결제대행사(PG사)의 실제 정산 금액을 기준으로 하되, 서비스의 내부 정산 기준에 따라 산정됩니다.
              </p>
              <p className={itemClassName}>
                5. 서비스는 정산 내역(판매 금액, 공제 항목, 정산 금액 등)을 뮤지션이 확인할 수 있도록 제공합니다.
              </p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제4조 (정산 지급일)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p className={itemClassName}>
                  1. 정산 금액은 결제대행사(PG사)의 정산 완료일을 기준으로 확정됩니다.
                </p>
                <p className={itemClassName}>
                  2. 서비스는 PG사로부터 정산금을 지급받은 날로부터 10이내 뮤지션에게 정산금을 지급합니다.
                </p>
                <p className={itemClassName}>
                  3. 정산금은 뮤지션이 사전에 등록한 계좌로 지급하는 것을 원칙으로 합니다.
                </p>

                <p className={itemClassName}>
                  4. 다음 각 호의 사유에 해당하는 경우에는 정산급 지급이 지연될 수 있습니다.
                </p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 결제대행사(PG사)의 정산 지연 또는 오류가 발생한 경우</p>
                  <p className={subItemClassName}>② 환불, 결제, 취소 또는 부정 결제 의심 거래에 대한 확인이 필요한 경우</p>
                  <p className={subItemClassName}>③ 관련 법령에 따른 지급 제한 또는 세무 처리 등의 사유가 있는 경우</p>
                  <p className={subItemClassName}>④ 천재지변, 시스템 장애 등 불가항력적인 사유가 발생한 경우</p>
                </div>

                <p className={itemClassName}>
                  5. 서비스는 제4항에 따른 지급 지연이 발생하는 경우, 그 사유를 지체 없이 뮤지션에게 안내합니다.
                </p>
              </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제5조 (정산 보류 및 제한)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p className={itemClassName}>
                  1. 서비스는 다음 각 호의 사유가 발생한 경우, 정산을 일시적으로 보류할 수 있습니다.
                </p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 허위 거래 또는 자기 구매(자전거래)가 객관적인 자료에 따라 확인되거나 합리적인 근거가 있는 경우</p>
                  <p className={subItemClassName}>② 타인의 저작물을 무단으로 업로드한 사실이 확인되거나, 관리자로부터 신고가 접수된 경우</p>
                  <p className={subItemClassName}>③ 서비스 정책 또는 관련 법령을 위반한 경우</p>
                  <p className={subItemClassName}>④ 환불, 결제 취소 또는 분쟁이 진행 중인 경우</p>
                </div>

                <p className={itemClassName}>
                  2. 서비스는 정산 보류 조치를 하는 경우, 그 사유와 보류 범위를 사전에 또는 지체없이 해당 뮤지션에게 통지합니다.
                </p>
                <p className={itemClassName}>
                  3. 뮤지션은 통지를 받은 날로부터 최소 7일 이상의 기간 내에 소명 자료를 제출할 수 있습니다.
                </p>
                <p className={itemClassName}>
                  4. 서비스는 제출된 자료를 검토하여, 소명 기간 종료 후 기간 내에 정산 재개 또는 제한여부를 결정하고 그 결과를 통지합니다.
                </p>

                <p className={itemClassName}>
                  5. 다음 각 호의 경우에는 정산금이의 전부 또는 일부 지급이 제한되거나 취소될 수 있습니다.
                </p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 위반 사실이 객관적인 자료에 의해 명확히 확인된 경우</p>
                  <p className={subItemClassName}>② 소명 자료가 제출되지 않거나, 제툴된 자료로도 문제가 해소되지 않은 경우</p>
                </div>

                <p className={itemClassName}>
                  6. 서비스는 정산 보류 및 제한 조치를 최소한의 범위에서 적용하며, 필요 이상의 정산 제한이 발생하지 않도록 노력합니다.
                </p>
              </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제6조 (환불 및 정산 조정)</h2>
            </div>

            <div className={`${bodyClassName} space-y-3`}>
              <p className={itemClassName}>
                1. 이용자의 환불 또는 결제 취소가 발생한 경우, 해당 금액은 정산 금액에서 차감됩니다.
              </p>
              <p className={itemClassName}>
                2. 환불 금액은 환불이 확정된 시점을 기준으로 해당 월 또는 이후 정산 내역에 반영 됩니다.
              </p>
              <p className={itemClassName}>
                3. 이미 뮤지션에게 정산이 완료된 금액에 대해 환불이 발생한 경우, 서비스는 해당 금액을다음 정산 시 우선적으로 차감할 수 있습니다.
              </p>
              <p className={itemClassName}>
                4. 다음 정산 금액에서 차감이 불가능하거나 부족한 경우, 서비슨는 해당 뮤지션에게 차감되지 않은 금액에 대해 별도로 반환을 요청할 수 있습니다.
              </p>
              <p className={itemClassName}>
                5. 서비스는 제3항 및 제4항에 따른 차감 또는 반환 요청 시, 그 사유 및 금액을 사전에 또는 지체 없이 뮤지션에게 통지합니다.
              </p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제7조 (세금 및 책임)</h2>
            </div>

            <div className={`${bodyClassName} space-y-3`}>
              <p className={itemClassName}>
                1. 뮤지션은 서비스에서 발생한 수익에 대해 고나련 법령에 따라 세금 신고 및 납구 의무를부담합니다.
              </p>
              <p className={itemClassName}>
                2. 뮤지션의 지위(개인, 사업자 등)에 따라 적용되는 세금의 종류 및 방식은 달라질 수 있으며, 이에 대한 책임은 해당 뮤지션에게 있습니다.
              </p>
              <p className={itemClassName}>
                3. 서비스는 관련 법령에 따라 필요한 경우, 뮤지션의  수익에 대해 원천징수 또는 세금 공제 등의 조치를 취할 수 있습니다.
              </p>
              <p className={itemClassName}>
                4. 제3항의 경우, 서비스는 관련 법령이 정한 기준에 따라 세금을 공제한 후 정산 금액을지급합니다.
              </p>
              <p className={itemClassName}>
                5. 서비스는 세무 신고 및 납부를 대행하지 않으며, 뮤지션은 자신의 세무 의무를 직접 이행해야 합니다.
              </p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제8조 (콘텐츠 권리 및 책임)</h2>
            </div>

            <div className={`${bodyClassName} space-y-3`}>
              <p className={itemClassName}>
                1. 뮤지션은 서비스에 업로드하는 콘텐츠에 대하여 정당한 권리를 보유하거나 적법한 사용권한을 확보하여야 합니다.
              </p>
              <p className={itemClassName}>
                2. 뮤지션은 자신이 업로드한ㅇ 콘텐츠로 인해 발생하는 저작권, 초상권 등 제3자의 권리침해에 대해 1차적인 책임을 부담합니다.
              </p>
              <p className={itemClassName}>
                3. 서비스는 이용자가 업로드한 콘텐츠를 중개·개시하는 플랫폼으로서, 콘텐츠의 권리 관계를 사전에 검증하지 않습니다
              </p>
              <p className={itemClassName}>
                4. 다만, 서비스는 권리 심해 신고가 접수되거나 위반 사실이 확인된 경우, 관련 법령에 따라 해당 콘텐츠의 삭제, 이용 제한 또는 기타 필요한 조치를 취할 수 있습니다.
              </p>
              <p className={itemClassName}>
                5. 서비스는 관련 법령에 따라 필요한 경우 권리자 보호 및 분쟁 해결을 위한 조치를 취하며, 이용자는 이에 협조하여야 합니다.
              </p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제9조 (계약의 성격)</h2>
            </div>

            <div className={`${bodyClassName} space-y-3`}>
              <p className={itemClassName}>
                1. 서비스는 뮤지션(아티스트)이 등록한 디지털 콘텐츠를 이용자에게 제공할 수 있도록 하는 콘텐츠 거래 및 이용 중개 플랫폼입니다.
              </p>
              <p className={itemClassName}>
                2. 서비스 내 개별 유료 콘텐츠에 관한 이용계약은, 서비스가 제공하는 결제 및 운영 시스템을 통하여 뮤지션과 이용자 사이에 체결되는 것을 원칙으로 합니다.
              </p>
              <p className={itemClassName}>
                3. 서비스는 콘텐츠의 등록, 노출, 결제, 다운로드 또는 재생 환경 등 거래가 이루어질 수 있는 시스템을 운영·관리합니다.
              </p>
              <p className={itemClassName}>
                4. 개별 콘텐츠에 대한 저작권 및 소유권은 해당 콘텐츠를 등록한 뮤지션 또는 정당한 권리자에게 귀속되며, 이용자는 구매를 통해 해당 콘텐츠에 대한 비독점적 이용권만을 취득합니다.
              </p>
              <p className={itemClassName}>
                5. 서비스는 플랫폼 운영자로서 관련 법령에 따라 필요한 관리 및 조치를 할 수 있으며, 권리 침해 신고, 환불, 정산, 이용 제한 등은 본 정책 및 관련 약관에 따라 처리됩니다.
              </p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제10조 (정책 변경)</h2>
            </div>

            <div className={`${bodyClassName} space-y-3`}>
              <p className={itemClassName}>
                1. 본 정책은 관련 법령 또는 서비스 운영 정책의 변경에 따라 변경될 수 있습니다.
              </p>
              <p className={itemClassName}>
                2. 서비스는 정책을 변경하는 경우, 변경 내용과 적용일자를 명시하여 최소 7일 이전부터 서비스 내 공지사항을 통해 사전 안내합니다.
              </p>
              <p className={itemClassName}>
                3. 다만, 이용자의 권리 또는 의무에 중대한 영향을 미치는 변경의 경우에는 최소 30일 이전에 공지합니다.
              </p>
              <p className={itemClassName}>
                4. 변경된 정책은 공지한 적용일자부터 효력이 발생합니다.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-7">
            <div className="mb-4">
              <h2 className={titleClassName}>부칙</h2>
            </div>
            <div className={`${bodyClassName} space-y-2`}>
              <p>본 정책은 시행일로부터 적용됩니다.</p>
              <p>시행일: 2026년 04월 10일</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}