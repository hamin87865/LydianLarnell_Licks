export default function RefundPage() {
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
          콘텐츠 구매 및 환불정책
        </h1>

        <p className="mb-10 max-w-4xl text-sm leading-7 text-white/60 md:mb-12 md:text-base">
          Lydian Larnell Licks(이하 "서비스")는 디지털 콘텐츠의 특성상 다음과 같은 구매 및 환불 정책을 적용합니다.
        </p>

        <div className="space-y-5">
          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제1조 (구매 상품의 정의)</h2>
            </div>

            <div className={`${bodyClassName} space-y-3`}>
              <p className={itemClassName}>1. 서비스에서 제공되는 콘텐츠느 다음과 같이 구분됩니다.</p>
              <div className="space-y-2">
                <p className={subItemClassName}>① 무료 콘텐츠: 회원이 별도의 결제 없이 이용할 수 있는 영상, 텍스트 등 콘텐츠</p>
                <p className={subItemClassName}>② 유료 콘텐츠: 이용자가 결제를 통해 이용 권한을 획득하는 디지털 콘텐츠</p>
              </div>

              <p className={itemClassName}>2. 서비스에서 판매되는 유료 콘텐츠는 다음과 같습니다.</p>
              <div className="space-y-2">
                <p className={subItemClassName}>① PDF 형태의 학습자료 (릭, 악보, 연습 자료 등 다운로드 가능 콘텐츠)</p>
                <p className={subItemClassName}>② 기타 서비스에서 유료로 제공되는 디지털 콘텐츠</p>
              </div>

              <p className={itemClassName}>3. 이용자는 유료 콘텐츠 구매 시 해당 콘텐츠에 대한 이용 권한을 부여받으며, 콘텐츠의 소유권 또는 저작권은 제작자에게 귀속됩니다.</p>
              <p className={itemClassName}>4. 모든 유료 콘텐츠 무형의 디지털 콘텐츠로 제공되며, 별도의 물리적 상춤은 제공되지 않습니다.</p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제2조 (결제 및 이용)</h2>
            </div>

            <div className={`${bodyClassName} space-y-3`}>
              <p className={itemClassName}>1. 이용자는 서비스에서 제공하는 유료 콘텐츠를 다음과 같은 결제 수단을 통해 구매할 수 있습니다.</p>
              <div className="space-y-2">
                <p className={subItemClassName}>① 신용카드, 체크카드</p>
                <p className={subItemClassName}>② 간편결제 서비스</p>
                <p className={subItemClassName}>③ 기타 서비스에서 제공하는 결제 수단</p>
              </div>

              <p className={itemClassName}>2. 유료 콘텐츠의 가격은 서비스 내에 표시된 금액을 기준으로 하며, 별도의 표시가 없는 한 부가세가 포함된 금액으로 합니다.</p>
              <p className={itemClassName}>3. 결제가 정상적으로 완료되면 이용자에게 해당 콘텐츠에 대한 잉용 권한이 즉시 부여됩니다.</p>

              <p className={itemClassName}>4. 유료 콘텐츠의 이용 방식은 다음과 같습니다.</p>
              <div className="space-y-2">
                <p className={subItemClassName}>① 영상 콘텐츠: 서비스 내 스트리밍 방식으로 이용</p>
                <p className={subItemClassName}>② PDF 등 다운로드 콘텐츠: 파일 다운로드를 통한 이용</p>
              </div>

              <p className={itemClassName}>5. 유료 콘텐츠의 이용 기간은 별도의 표시가 없는 한 구매 시점부터 이용자의 계정이 유지되는 동안 지속적으로 이용 가능한 것으로 합니다.</p>
              <p className={itemClassName}>6. 일부 콘텐츠는 로그인 상태에서만 이용이 가능하며, 계정 상태에 따라 이용이 제한될 수 있습니다.</p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제3조 (청약철회 및 환불 정책)</h2>
            </div>

            <div className={`${bodyClassName} space-y-3`}>
              <p className={itemClassName}>1. 서비스는 「전자상거래 등에서의 소비자 보호에 관한 법률」에 따라 환불 및 청약철회 정책을 운영합니다.</p>
              <p className={itemClassName}>2. 이용자는 유료 콘텐츠 구매 후 7일 이내 청약철회를 요청할 수 있습니다.</p>

              <p className={itemClassName}>3. 다만, 다음 각 호의 경우에는 쳥약철회가 제한될 수 있습니다.</p>
              <div className="space-y-2">
                <p className={subItemClassName}>① 디지털 콘텐츠의 제공이 게시된 경우</p>
                <p className={subItemClassName}>② 이용자가 콘텐츠를 다운로드하거나 이용한 경우</p>
                <p className={subItemClassName}>
                  단, 위와 같은 경우에도 서비스는 사전에 해당 사실을 명확히 고지하고 이용자의 동의를 받은 경우에 한하여 청약철회를 제한할 수 있습니다.
                </p>
              </div>

              <p className={itemClassName}>4. 다음 각 호의 경우에는 환불이 가능합니다.</p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제4조 (환불 절차)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p className={itemClassName}>1. 서비스에서 제공하는 유료 콘텐츠는 「전자상거래 등에서의 소비자 보호에 관한 법률」에 따라 원칙적으로 결제 후 7일 이내 청약철회가 가능합니다.</p>
                <p className={itemClassName}>2. 다만, 다음 각 호의 경우에는 청약철회 및 환불이 제한될 수 있습니다.</p>

                <div className="space-y-2">
                  <p className={subItemClassName}>① 콘텐츠의 다운로드가 게시된 경우</p>
                  <p className={subItemClassName}>② 영상 등 콘텐츠의 재생 또는 이용이 개시된 경우</p>
                </div>

                <p className={itemClassName}>3. 제2항에 따른 청약철회 제한은, 서비스가 결제 전에 다음 사항을 명확히 고지하고 이용자의 동의를 받은 경우에 한하여 적용됩니다.</p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 디지털 콘텐츠의 특성상 이용 또는 다운로드 시 청약철회가 제한될 수 있다는 사실</p>
                </div>

                <p className={itemClassName}>4. 이용자가 콘텐츠를 다운로드하거나 재생하는 등 이용을 개시한 경우, 해당 시점부터 청약철회가 제한됩니다.</p>

                <p className={itemClassName}>5. 다음 각 호의 경우에는 제2항에도 불구하고 환불이 가능합니다.</p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 서비스의 중대한 오류로 인해 콘텐츠 이용이 불가능한 경우</p>
                  <p className={subItemClassName}>② 결제 내용과 다른 콘텐츠가 제공된 경우</p>
                </div>
              </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제5조 (콘텐츠 이용 제한)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p className={itemClassName}>1. 이용자는 서비스에서 제공하는 콘텐츠를 이용함에 있어 다음 각 호의 행위를 해서는 안 됩니다.</p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 구매한 콘텐츠의 무단 공유, 복제 또는 배포 행위</p>
                  <p className={subItemClassName}>② 저작권 등 타인의 권리를 침해하는 행위</p>
                  <p className={subItemClassName}>③ 부정한 방법을 통해 콘텐츠를 다운로드하거나 접근을 시도하는 행위</p>
                </div>

                <p className={itemClassName}>2. 서비스는 이용자가 제1항의 행위를 한 경우, 위반의 정도 및 반복성 등을 고려하여 다음과 같은 조치를 취할 수 있습니다.</p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 경고 또는 시정 요청</p>
                  <p className={subItemClassName}>② 콘텐츠 이용 제한</p>
                  <p className={subItemClassName}>③ 콘텐츠 삭제</p>
                  <p className={subItemClassName}>④ 계정의 일시 정지 또는 영구 이용 제한</p>
                </div>

                <p className={itemClassName}>3. 서비스는 위반 행위가 중대하거나 반복되는 경우, 관련 법령에 따라 ㅁ민형사상 법적 조치를 취할 수 있습니다.</p>
                <p className={itemClassName}>4. 서비스는 제재 조치 시 사전 또는 사후에 그 사유를 이용자에게 통지할 수 있습니다.</p>
              </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제6조 (책임의 제한)</h2>
            </div>

            <div className={`${bodyClassName} space-y-3`}>
              <p className={itemClassName}>1. 서비스는 다음 각 호의  사유로 인해 이용자가 서비스를 이용하지 못하거나 손해가 발생한 경우 책임을지지 않습니다.</p>
              <div className="space-y-2">
                <p className={subItemClassName}>① 이용자의 기기 환경, 설정 또는 네트워크 환경으로 인한 서비스 이용 불가</p>
                <p className={subItemClassName}>② 인터넷 통신 상태의 불안정으로 인한 다운로드 실패 또는 접속 지연</p>
                <p className={subItemClassName}>③ 이용자의 부주의 또는 과실로 인한 파일 손실 또는 데이터 손상</p>
              </div>

              <p className={itemClassName}>2. 서비스는 뮤료로 제공되는 콘텐츠에 대하여 품질, 안정성, 정확성 등에 대해 보증하지 않으며, 이에 따른 손해에 대해 책임을지지 않습니다.</p>
              <p className={itemClassName}>3. 단, 서비스의 고의 또는 중대한 과실로 인하여 발생한 손해에 대해서는 관련 법령에 따라 책임을 부담합니다.</p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제7조 (정책 변경)</h2>
            </div>

            <div className={`${bodyClassName} space-y-3`}>
              <p className={itemClassName}>1. 본 정책은 관련 법령 또는 서비스 운영 정책의 변경에 따라 변경될 수 있습니다.</p>
              <p className={itemClassName}>2. 서비스는 정책을 변경하는 경우, 변경 내용과 적용일자를 명시하여 최소 7일 이전부터 서비스 내 공지사항을 통해 사전 안내합니다.</p>
              <p className={itemClassName}>3. 다만, 이용자의 권리 또는 의무에 중대한 영향을 미치는 변경의 경우에는 최소 30일 이전에 사전 공지합니다.</p>
              <p className={itemClassName}>4. 변경된 정책은 공지한 적용일자부터 효력이 발생합니다.</p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제8조 (사업자 정보, 콘텐츠 핮다 및 분쟁 해결)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p className={itemClassName}>1. 서비스는 관련 법령에 따라 다음 각 호의 사업자 정보를 이용자가 확인할 수 있도록 표시합니다.</p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 상호</p>
                  <p className={subItemClassName}>② 대표자 성명</p>
                  <p className={subItemClassName}>③ 사업자등록번호</p>
                  <p className={subItemClassName}>④ 통신판매업 신고버호</p>
                  <p className={subItemClassName}>⑤ 사업장 소재지</p>
                  <p className={subItemClassName}>⑥ 전자우편주소 및 연락처</p>
                </div>

                <p className={itemClassName}>2. 서비스는 유료 디지털 콘텐츠의 결제 이전에 다음 사항을 이용자에게 명확히 안내합니다.</p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 콘텐츠의 가격 및 이용 조건</p>
                  <p className={subItemClassName}>② 청약철회 가능 여부 및 환불 제한 조건</p>
                  <p className={subItemClassName}>③ 디지털 콘텐츠의 특성상 다운로드 또는 이용이 개시된 경우 청약철회가 제한될 수 있다는 사실</p>
                </div>

                <p className={itemClassName}>3. 제2항 제3호의 청약철회 제한은 서비스가 결제 화면 등에서 이를 사전에 고지하고, 이용자로부터 명시적인 동의를 받은 경우에 한하여 적용됩니다.</p>

                <p className={itemClassName}>4. 다음 각 호의 경우에는 콘텐츠의 하자가 있는 것으로 봅니다.</p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 파일이 정상적으로 열리지 않거나 재생되지 않는 경우</p>
                  <p className={subItemClassName}>② 파일이 손상되어 정상적인 다운로드 또는 이용이 불가능한 경우</p>
                  <p className={subItemClassName}>③ 결제한 콘텐츠와 실제 제공된 콘텐츠가 다른 경우</p>
                  <p className={subItemClassName}>④ 서비스의 중대한 오류로 인해 콘텐츠 이용이 불가능한 경우</p>
                </div>

                <p className={itemClassName}>5. 이용자는 콘텐츠의 하자, 결제, 환불, 이용 제한 등과 관련한 문의 또는 이의를 고객센터 또는 서비스가 지정한 전자우편을 통해 신청할 수 있습니다.</p>
                <p className={itemClassName}>6. 서비스는 이용자의 문의 또는 분쟁 해결 요청이 접수된 날부터 합리적인 기간 내에 이를 확인하고 처리하며, 관련 법령 및 내부 정책에 따라 필요한 조치를 취합니다.</p>
                <p className={itemClassName}>7. 서비스와 이용자 간 분쟁이 원만하게 해결되지 않는 경우, 관련 법령에 따라 한국소비자원, 전자거래분쟁조정위원회 또는 관할 기관을 통한 분쟁조정 절차를 진행할 수 있습니다.</p>
              </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-7">
            <div className="mb-4">
              <h2 className={titleClassName}>부칙</h2>
            </div>
            <div className={`${bodyClassName} space-y-2`}>
              <p>본 정책은 시행일로부터 적용됩니다.</p>
              <p>시행일: 2026년 03월 27일</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}