export default function TermsPage() {
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
          이용약관
        </h1>

        <p className="mb-10 max-w-3xl text-sm leading-7 text-white/60 md:mb-12 md:text-base">
          Lydian Larnell Licks 서비스 이용과 관련된 권리, 의무 및 책임사항을 규정합니다.
        </p>

        <div className="space-y-5">
          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제1조 (목적)</h2>
            </div>
            <div className={bodyClassName}>
              <p>
                이 약관은 Lydian Larnell Licks(이하 "서비스")가 제공하는 음악 학습 콘텐츠 공유 플랫폼 서비스의 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제2조 (정의)</h2>
            </div>
            <div className={`${bodyClassName} space-y-2`}>
              <p className={itemClassName}>1. "서비스"란 Lydian Larnell Licks 웹사이트 및 관련 제반 서비스를 의미합니다.</p>
              <p className={itemClassName}>2. "이용자"란 본 약관에 따라 서비스에 접속하여 이용하는 회원 및 비회원을 말합니다.</p>
              <p className={itemClassName}>3. "회원"이란 서비스에 가입하여 로그인 후 이용하는 자를 말합니다.</p>
              <p className={itemClassName}>4. "아티스트"란 서비스 내에서 콘텐츠(영상, 텍스트, PDF 등)를 업로드할 수 있는 권한을 가진 회원을 의미합니다.</p>
              <p className={itemClassName}>5. "콘텐츠"란 서비스 내에 게시되는 영상, 텍스트, 이미지, PDF 파일 등의 자료를 의미합니다.</p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제3조 (약관의 효력 및 변경)</h2>
            </div>
            <div className={`${bodyClassName} space-y-2`}>
              <p className={itemClassName}>1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력이 발생합니다.</p>
              <p className={itemClassName}>2. 서비스는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</p>
              <p className={itemClassName}>3. 변경된 약관은 공지 시점부터 효력이 발생하며, 이용자가 계속 서비스를 이용할 경우 변경에 동의한 것으로 간주합니다.</p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제4조 (회원가입 및 계정관리)</h2>
            </div>
            <div className={`${bodyClassName} space-y-2`}>
              <p className={itemClassName}>1. 이용자는 이름, 이메일, 비밀번호, 닉네임을 입력하여 회원가입을 신청할 수 있습니다.</p>
              <p className={itemClassName}>2. 서비스는 이메일 인증을 통해 회원가입 절차를 완료합니다.</p>
              <p className={itemClassName}>3. 회원은 자신의 계정 정보를 안전하게 관리할 책임이 있으며, 이를 제3자에게 제공해서는 안 됩니다.</p>
              <p className={itemClassName}>4. 계정 도용으로 인해 발생하는 모든 책임은 이용자에게 있으며, 이용자의 과실이 없는 경우 사업자 책임이 가능합니다.</p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제5조 (서비스 이용)</h2>
            </div>
            <div className={`${bodyClassName} space-y-2`}>
              <p className={itemClassName}>1. 서비스는 음악 학습을 위한 콘텐츠(릭, 영상, PDF 등)를 제공 및 공유하는 플랫폼입니다.</p>
              <p className={itemClassName}>2. 이용자는 로그인 여부와 관계없이 콘텐츠를 열람할 수 있습니다.</p>
              <p className={itemClassName}>3. 단, PDF 다운로드 및 일부 기능은 로그인한 회원에게만 제공될 수 있습니다.</p>
              <p className={itemClassName}>4. 서비스는 운영상 필요에 따라 기능을 변경하거나 중단할 수 있으며, 합리적 사유(점검, 장애등)를 정확히 명시를 합니다.</p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제6조 (아티스트 및 콘텐츠 업로드)</h2>
            </div>
            <div className={`${bodyClassName} space-y-2`}>
              <p className={itemClassName}>1. 아티스트는 서비스에 영상, 텍스트, PDF 콘텐츠를 업로드할 수 있습니다.</p>
              <p className={itemClassName}>2. 업로드된 콘텐츠의 저작권 및 책임은 해당 아티스트에게 있습니다.</p>
              <p className={itemClassName}>3. 아티스트는 타인의 권리를 침해하는 콘텐츠를 업로드해서는 안 됩니다.</p>
              <p className={itemClassName}>4. 서비스는 다음과 같은 경우 콘텐츠를 사전 통보 없이 삭제할 수 있습니다.</p>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className={`${bodyClassName} space-y-2`}>
                <p className={dashItemClassName}>* 저작권 침해 또는 불법 콘텐츠</p>
                <p className={dashItemClassName}>* 음란, 폭력, 혐오 표현이 포함된 경우</p>
              </div>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제7조 (콘텐츠 이용 및 권리)</h2>
            </div>
            <div className={`${bodyClassName} space-y-2`}>
              <p className={itemClassName}>
                1. 서비스 내 모든 콘텐츠의 저작권은 제작자에게 귀속됩니다. 다만, 서비스는 해당 콘텐츠를 서비스 내에서 제공, 전시, 홍보 및 운영하기 위한 이용권을 가집니다.
              </p>
              <p className={itemClassName}>
                2. 사용자는 서비스를 통해 제공되는 콘텐츠를 개인적인 용도로만 이용할 수 있으며, 상업적 목적으로 사용할 수 없습니다.
              </p>
              <p className={itemClassName}>
                3. 사용자는 서비스의 사전 동의 없이 콘텐츠를 복제, 배포, 판매, 재가공, 공개 전송하는 행위를 할 수 없습니다.
              </p>
              <p className={itemClassName}>
                4. 서비스 내에 등록된 유튜브 링크 영상의 경우, 해당 콘텐츠의 저작권은 원 제작권자 및 유튜브 정책에 따르며, 뮤지션은 유튜브의 이용약관 및 관련 정책을 준수해야 합니다.
              </p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제8조 (PDF 및 다운로드 정책)</h2>
            </div>
            <div className={`${bodyClassName} space-y-2`}>
              <p className={itemClassName}>
                1. 서비스 내 일부 콘텐츠(PDF 등)는 로그인한 회원에 한하여 다운로드가 가능하며, 일부 콘텐츠는 유료로 제공될 수 있습니다.
              </p>
              <p className={itemClassName}>
                2. 유료 콘텐츠의 경우, 결제 완료 후에만 다운로드가 가능하며, 결제 금액 및 조건은 각 콘텐츠 상세 페이지에 표시됩니다.
              </p>
              <p className={itemClassName}>
                3. 다운로드한 콘텐츠는 이용자 본인의 개인 학습 및 비상업적 용도로만 사용할 수 있습니다.
              </p>
              <p className={itemClassName}>
                4. 이용자는 서비스 또는 콘텐츠 제공자의 사전 동의 없이 콘텐츠를 복제, 공유, 재배포, 판매, 전송, 전시하거나 이를 이용한 2차적 저작물을 제작할 수 없습니다.
              </p>
              <p className={itemClassName}>
                5. 디지털 콘텐츠의 특성상 다운로드가 완료된 이후에는 원칙적으로 청약철회 및 환불이 제한되며, 관계법령 및 서비스의 환불 정책에 따릅니다.
              </p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제9조 (금지행위)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p>1. 이용자는 다음 각 호의 행위를 해서는 안 됩니다.</p>

                <div className="space-y-2">
                  <p className={subItemClassName}>① 타인의 계정을 도용하거나 부정하게 사용하는 행위.</p>
                  <p className={subItemClassName}>② 서비스의 정상적인 운영을 방해하는 행위.</p>
                  <p className={subItemClassName}>③ 불법 콘텐츠를 업로드하거나 유통하는 행위.</p>
                  <p className={subItemClassName}>④ 저작권, 초상권 등 타인의 지적재산권을 침해하는 행위</p>
                  <p className={subItemClassName}>⑤ 기타 관련 법령에 위반되는 행위</p>
                </div>

                <p>2. 서비스는 이용자가 제1항의 행위를 한 경우, 콘텐츠 삭제, 계정 정지 또는 탈퇴 처리 될 수 있습니다.</p>
                <p>3. 서비스는 위반 행위의 내용, 반복성, 고의성 등을 종합적으로 고려하여 제재 수위를 결정합니다.</p>
                <p>4. 서비스는 제재 조치 시 사전 또는 사후에 그 사유를 이용자에게 통지해야 합니다.</p>
                <p>5. 이용자는 제재 조치에 대해 이의가 있는 경우, 서비스가 정한 절차에 따라 이의를 제기할 수 있습니다.</p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제10조 (서비스 제공의 중단)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p>1. 서비스는 다음 각 호의 사유가 발생한 경우 서비스의 전부 또는 일부를 일시적으로 중단할 수 있습니다.</p>

                <div className="space-y-2">
                  <p className={subItemClassName}>① 시스템 점검, 유지보수 또는 설비의 보수-교체가 필요한 경우</p>
                  <p className={subItemClassName}>② 서버 장애, 통신 장애 등 기술적 문제가 발생한 경우</p>
                  <p className={subItemClassName}>③ 천재지변, 국가비상사태 등 불가항력적인 사유가 발생한 경우</p>
                </div>

                <p>2. 서비스 중단에 대한 공지는 다음과 같습니다.</p>

                <div className="space-y-2">
                  <p className={subItemClassName}>
                    ① 일반 중단: 사전에 예정된 점검 또는 유지보수의 경우, 서비스 내 공지사항 등을 통해 사전에 안내합니다.
                  </p>
                  <p className={subItemClassName}>
                    ② 긴급 중단: 장애, 해킹, 시스템 오류, 등 긴급한 사유로 사전 공지가 어려운 경우, 사후 지체 없지 공지합니다.
                  </p>
                </div>

                <p>
                  3. 서비스는 서비스 중단으로 인해 이용자에게 발생한 손해에 대해 책임을지지 않습니다. 다만, 서비스의 고의 또는 중대한 과실로 인한 경우에는 관련 법령에 따라 책임을 부담합니다.
                </p>
                <p>
                  4. 서비스는 서비스 중단이 장기간 지속되는 경우, 이용자 보호를 위하여 별도의 보상 또는 조치를 검토할 수 있습니다.
                </p>
              </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제11조 (면책조항)</h2>
            </div>
            <div className={`${bodyClassName} space-y-2`}>
              <p>1. 서비스는 이용자가 게시하거나 제공한 콘텐츠의 정확성, 확장성, 신뢰성, 완전성에 대해 보증하지 않으며, 이로 인해 발생하는 손해에 대해 책임을지지 않습니다.</p>
              <p>2. 서비스는 이용자 간 또는 이용자와 제3자 간에 발생한 분쟁에 대해 개입하지 않으며, 이에 대한 책임을 지지 않습니다.</p>
              <p>3. 서비스는 무료로 제공되는 콘텐츠 및 서비스에 대하여 품질, 안전성, 적합성 등에 대한 어떠한 보증도 하지 않습니다.</p>
              <p>4. 서비스는 천재지변, 시스템 장애, 해킹 등 불가항력적인 사유로 인해 발생한 손해에 책임을 지지 않습니다.</p>
              <p>5. 단, 서비스의 고의 또는 중대한 과실로 인하여 발생한 손해에 대해서는 관련 법령에 따라 책임을 부담합니다.</p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제12조 (회원탈퇴 및 이용제한)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p>1. 회원은 언제든지 서비스가 정한 절차에 따라 회원탈퇴를 요청할 수 있으며, 서비스는 관련 법령 및 내부 정책에 따라 이를 처리합니다.</p>

                <p>2. 서비스는 회원이 약관을 위반한 경우, 위반 행위의 정도 및 반복성 등을 고려하여 다음과 같은 조치를 취할 수 있습니다.</p>

                <div className="space-y-2">
                  <p className={subItemClassName}>① 서비스 이용의 일부 또는 전부 제한</p>
                  <p className={subItemClassName}>② 콘텐츠 삭제</p>
                  <p className={subItemClassName}>③ 계정 정지 또는 탈퇴 처리</p>
                </div>

                <p>
                  3. 서비스는 제2항에 따른 조치를 취하기 전에 원칙적으로 회원에게 사전 통지하며, 회원에게 일정기간 동안 소명할 기회를 제공합니다.다만, 다음 각 호의 경우에는 사전 통지 없이 즉시 조치를 취할 수 있습니다.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p>① 법령 위반 또는 권리 침해가 명백한 경우</p>
                    <div className="space-y-2">
                      <p className={dashItemClassName}>- 저작권 침해 신고가 접수되어 관리자가 소명을 요청한 경우</p>
                      <p className={dashItemClassName}>- 불법 촬영물, 음란물, 불법 복제물 등 관련 법령에 따라 즉시 차단이 필요한 콘텐츠</p>
                      <p className={dashItemClassName}>- 타인의 개인정보를 무단으로 공개하거나 유출한 경우</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p>② 서비스 운영에 중대한 장애를 발생시키는 경우</p>
                    <div className="space-y-2">
                      <p className={dashItemClassName}>- 비정상적인 트래픽 유발, 서버 공격(DDOS), 해킹 시도 등</p>
                      <p className={dashItemClassName}>- 자동화 프로그램, 메크로 등을 이용하여 서비스 시스템에 과부하를 발생시키는 행위</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p>③ 이용자 보호를 위해 긴급 조치가 필요한 경우</p>
                    <div className="space-y-2">
                      <p className={dashItemClassName}>- 사기, 허위정보, 금전 피해 발생 가능성이 높은 콘텐츠</p>
                      <p className={dashItemClassName}>- 신고가 닥수 접수되어 피해 확산이 우려되는 경우</p>
                      <p className={dashItemClassName}>- 기타 즉시 조치를 하지 않을 경우 이용자에게 실질적 피해가 발생할 가능성이 높은 경우</p>
                    </div>
                  </div>
                </div>

                <p>4. 회원은 서비스의 조치에 대해 이의가 있는 경우, 서비스가 정한 절차에 따라 이의를 제기할 수 있습니다.</p>
                <p>5. 회원탈퇴 또는 이용 제한 시, 관련 법령 및 서비스 정책에 따라 일부 정보는 일정 기간 보관될 수 있습니다.</p>
              </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제13조 (개인정보 보호)</h2>
            </div>
            <div className={`${bodyClassName} space-y-2`}>
              <p>1. 서비스는 이용자의 개인정보를 보호하기 위하여 관련 법령을 준수하며, 개인정보의 수집, 이용, 보관 및 제3자 제공 등에 관한 사항은 별도로 공개된 개인정보 처리방침에 따릅니다.</p>
              <p>2. 이용자는 서비스 이용 시 개인정보 처리방침에 동의한 것으로 간주됩니다.</p>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제14조 (준거법 및 관할)</h2>
            </div>
            <div className={bodyClassName}>
              <p>본 약관은 대한민국 법을 준거법으로 하며, 서비스와 관련하여 발생한 분쟁은 대한민국 법원에 따릅니다.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-7">
            <div className="mb-4">
              <h2 className={titleClassName}>부칙</h2>
            </div>
            <div className={`${bodyClassName} space-y-2`}>
              <p>본 약관은 2026년 4월 10일부터 시행됩니다.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}