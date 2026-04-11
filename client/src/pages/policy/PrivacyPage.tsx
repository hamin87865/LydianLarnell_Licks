export default function PrivacyPage() {
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
          개인정보 처리방침
        </h1>

        <p className="mb-10 max-w-4xl text-sm leading-7 text-white/60 md:mb-12 md:text-base">
          Lydian Larnell Licks(이하 "서비스")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」을 준수합니다.
          서비스는 개인정보처리방침을 통해 이용자가 제공한 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보 보호를 위해 어떠한 조치를 취하고 있는지 알려드립니다.
        </p>

        <div className="space-y-5">
          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제1조 (수집하는 개인정보 항목)</h2>
            </div>

            <div className={`${bodyClassName} space-y-4`}>
              <p>서비스는 회원가입 및 서비스 이용을 위해 다음과 같은 개인정보를 수집합니다.</p>

              <div className="space-y-3">
                <p>1. 회원가입 시</p>
                <div className="space-y-2">
                  <p className={dashItemClassName}>- 이메일 주소</p>
                  <p className={dashItemClassName}>- 비밀번호</p>
                  <p className={dashItemClassName}>- 닉네임</p>
                </div>
              </div>

              <div className="space-y-3">
                <p>2. 서비스 이용 과정에서 자동으로 생성-수집되는 정보</p>
                <div className="space-y-2">
                  <p className={dashItemClassName}>- 접속 IP 주소</p>
                  <p className={dashItemClassName}>- 쿠키</p>
                  <p className={dashItemClassName}>- 방문 기록</p>
                  <p className={dashItemClassName}>- 서비스 이용 기록</p>
                  <p className={dashItemClassName}>- 기기 정보(운영체제(OS), 브라우저 종류 및 버전, 기기 식별 정보 등)</p>
                </div>
              </div>

              <div className="space-y-3">
                <p>3. 뮤지션(아티스트) 신청 시</p>
                <div className="space-y-2">
                  <p className={dashItemClassName}>- 이름 또는 활동명</p>
                  <p className={dashItemClassName}>- 자기소개</p>
                  <p className={dashItemClassName}>- 제출한 파일(동영상 등)계좌</p>
                </div>
              </div>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제2조 (개인정보의 수집 및 이용 목적)</h2>
            </div>

            <div className={`${bodyClassName} space-y-4`}>
              <p>서비스는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p>1. 회원 관리</p>
                  <div className="space-y-2">
                    <p className={dashItemClassName}>- 회원 식별 및 본인 확인</p>
                    <p className={dashItemClassName}>- 회원가입 의사 확인 및 계정 생성</p>
                    <p className={dashItemClassName}>- 로그인 및 서비스 이용 인증 처리</p>
                    <p className={dashItemClassName}>- 회원 탈퇴 및 계정 관리</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p>2. 서비스 제공 및 운영</p>
                  <div className="space-y-2">
                    <p className={dashItemClassName}>- 콘텐츠 제공 및 이용 지원</p>
                    <p className={dashItemClassName}>- 우료 콘텐츠(PDF 등) 구매 및 다운로드 기능 제공</p>
                    <p className={dashItemClassName}>- 결제 처리 및 이용 내역 관리</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p>3. 맞춤형 서비스 제공</p>
                  <div className="space-y-2">
                    <p className={dashItemClassName}>- 이용자의 관심 콘텐츠 및 이용 이력 기반 추천 콘텐츠 제공</p>
                    <p className={dashItemClassName}>- 이용자 활동 패턴을 반영한 개인화된 화면 및 서비스 구성 제공</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p>4. 뮤지션(아티스트) 신청 및 관리</p>
                  <div className="space-y-2">
                    <p className={dashItemClassName}>- 뮤지션 신청 접수 및 심사</p>
                    <p className={dashItemClassName}>- 승인 여부 결정 및 계정 권한 관리</p>
                    <p className={dashItemClassName}>- 업로드 콘텐츠 관리 및 운영</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p>5. 서비스 개선 및 분석</p>
                  <div className="space-y-2">
                    <p className={dashItemClassName}>- 서비스 이용 통계 분석 및 이용 패턴 분석</p>
                    <p className={dashItemClassName}>- 기능 개선 및 신규 서비스 개발</p>
                    <p className={dashItemClassName}>- 서비스 품질 향상을 위한 내부 데이터 분석</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p>6. 부정 이용 방지 및 보안 유지</p>
                  <div className="space-y-2">
                    <p className={dashItemClassName}>- 비정상 이용 탐지 및 계정 도용 방지</p>
                    <p className={dashItemClassName}>- 불법 행위 및 약관 위반 행위 차단</p>
                    <p className={dashItemClassName}>- 보안 사고 대응 및 시스템 보호</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제3조 (개인정보의 보유 및 이용 기간)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p>1. 서비스는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>

                <p>2. 다만, 다음의 정보에 대해서는 아래의 기간 동안 보관합니다.</p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 회원 정보: 회원 탈퇴 시까지</p>
                  <p className={subItemClassName}>② 서비스 이용 기록: 최대 1년</p>
                </div>

                <p>3. 관계 법령에 따라 일정 기간 보관이 필요한 경우에는 다음과 같이 보관합니다.</p>
                <div className="space-y-2">
                  <p className={dashItemClassName}>- 계약 또는 청약철회 등에 관한 기록: 5년 (전자거래법)</p>
                  <p className={dashItemClassName}>- 대금 결제 및 재화 등의 공급에 관한 기록:5년 (전자거래법)</p>
                  <p className={dashItemClassName}>- 소비자의 불만 또는 분쟁 처리에 관한 기록: 3년 (전자거래법)</p>
                  <p className={dashItemClassName}>- 접속 로그 기록: 3개월 (통신비밀보호법)</p>
                </div>

                <p>4. 개인정보는 보관 기간이 경과하거나, 처리 목적이 달성된 경우 지체 없이 파기합니다.</p>
              </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제4조 (개인정보의 제3자 제공)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p>1. 서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.</p>

                <p>2. 다만, 다음 각 호의 경우에는 예외적으로 개인정보를 제3자에게 제공할 수 있습니다.</p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 이용자가 사전에 동의한 경우</p>
                  <p className={subItemClassName}>② 법령에 근거하거나 수사기관의 요청이 있는 경우</p>
                  <p className={subItemClassName}>③ 서비스 제공을 위해 필요한 경우 (예: 결제 처리 등)</p>
                </div>

                <p>3. 제2항에 따라 개인정보를 제3자에게 제공하는 경우, 서비스는 다음 사항을 사전에 이용자에게 고지하고 동의를 받습니다.</p>
                <div className="space-y-2">
                  <p className={dashItemClassName}>- 제공받는 자</p>
                  <p className={dashItemClassName}>- 제공 항목</p>
                  <p className={dashItemClassName}>- 제공 목적</p>
                  <p className={dashItemClassName}>- 보유 및 이용 기간</p>
                </div>
              </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제5조 (개인정보의 처리 위탁)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p>1. 서비스는 원활한 서비스 제공을 위하 다음과 같이 개인정보 처리 업무를 외부 업체에 위탁할 수 있습니다.</p>

                <p>2. 서비스는 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
                <div className="space-y-2">
                  <p className={dashItemClassName}>- Render Inc.: 서버 및 데이터베이스 운영</p>
                  <p className={dashItemClassName}>- PostgreSQL(DB 서비스): 데이터 저장 및 관리</p>
                  <p className={dashItemClassName}>- Google LLC: 이메일 발송 및 관련 서비스 제공</p>
                </div>

                <p>3. 서비스 위탁계약 체결 시 개인정보 보호 관련 법령에 따라 다음 사항을 계약에 포함하고 이를 준수하도록 관리·감독합니다.</p>
                <div className="space-y-2">
                  <p className={dashItemClassName}>- 개인정보 처리 목적 외 이용 금지</p>
                  <p className={dashItemClassName}>- 개인정보의 기술적·관리적 보호 조치</p>
                  <p className={dashItemClassName}>- 재위탁 재한</p>
                  <p className={dashItemClassName}>- 개인정보 접근 제한 등 안전성 확보 조치</p>
                </div>

                <p>4. 위탁업무의 내용이나 수탁자가 변경될 경우, 서비스는 자체 없이 본 개인정보 처리방침을 통해 공개합니다.</p>
              </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제6조 (이용자의 권리)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p>1. 이용자는 언제든지 다음 각 호의 권리를 행사할 수 있습니다.</p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 개인정보 열람 요청</p>
                  <p className={subItemClassName}>② 개인정보 수정 요청</p>
                  <p className={subItemClassName}>③ 회원 탈퇴 요청</p>
                  <p className={subItemClassName}>④ 개인정보 처리 정지 요청</p>
                </div>

                <p>2. 이용자는 제1항의 권리를 다음과 같은 방법으로 행사할 수 있습니다.</p>
                <div className="space-y-2">
                  <p className={dashItemClassName}>- 서비스 내 계정 설정 또는 마이페이지를 통한 직접 변경</p>
                  <p className={dashItemClassName}>- 고객센터를 통한 요청</p>
                </div>

                <p>3. 서비스는 이용자의 요청을 받은 경우, 관련 법령에 따라 지체 없이 조체하며, 정당한 사유가 없는 한 이를 거부하지 않습니다.</p>
                <p>4. 이용자의 요청이 법령에 따라 제한될 수 있는 경우에는 그 사유를 이용자에게 안내합니다.</p>
              </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제7조 (개인정보의 파기)</h2>
            </div>

            <div className={`${bodyClassName} space-y-4`}>
              <p>서비스는 개인정보 보유기간의 경과 또는 처리 목적 달성 시 지체 없이 해당 정보를 파기합니다.</p>

              <div className="space-y-2">
                <p className={itemClassName}>전자적 파일: 복구 불가능한 방법으로 삭제</p>
                <p className={itemClassName}>종이 문서: 분쇄 또는 소각</p>
              </div>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제8조 (개인정보 보호를 위한 기술적/관리적 조치)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p>1. 서비스는 이용자의 개인정보를 안전하게 보호하기 위하여 관련 법령에 따라 다음과 같은 기술적·관리적 조치를 취하고 있습니다.</p>

                <div className="space-y-3">
                  <p>2. 기술적 보호 조치</p>
                  <div className="space-y-2">
                    <p className={subItemClassName}>① 비밀번호 등 주요 개인정보의 암호화 저장</p>
                    <p className={subItemClassName}>② HTTPS 적용을 통한 개인정보 전송 구간 암호화</p>
                    <p className={subItemClassName}>③ 해킹 및 악성 프로그램 방지를 위한 보안 시스템 운영</p>
                    <p className={subItemClassName}>④ 비정상적인 접근 시도 및 트래픽에 대한 탐지 및 차단</p>
                    <p className={subItemClassName}>⑤ 개인정보 처리 시스템에 대한 접근 기록(로그) 보관 및 관리</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p>3. 관리적 보호 조치</p>
                  <div className="space-y-2">
                    <p className={subItemClassName}>① 개인정보 접근 권한의 최소화 및 담당자 지정</p>
                    <p className={subItemClassName}>② 내부 관리 계획 수립 및 정기적인 보안 점검</p>
                    <p className={subItemClassName}>③ 개인정보 처리 직원에 대한 보안 교육 실시</p>
                  </div>
                </div>

                <p>4. 서비스는 개인정보 보호를 위해 지속적으로 보안 수준을 강화하며, 관련 법령을 준수합니다.</p>
              </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제9조 (쿠키 사용 및 관리)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p>1. 서비스는 이용자에게 보다 편리한 서비스 제공을 위하여 쿠키(cookie)를 사용할 수 있습니다.</p>

                <p>2. 쿠키는 다음과 같은 목적을 위해 사용됩니다.</p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 로그인 상태 유지 및 이용자 인증</p>
                  <p className={subItemClassName}>② 서비스 이용 기록 분석 및 통계 분석</p>
                  <p className={subItemClassName}>③ 이용자의 관심사 및 이용 패턴을 반영한 개인화 서비스 제공</p>
                </div>

                <p>3. 이용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다.</p>
                <p>4. 다만, 쿠키 저장을 거부할 경우 로그인 유지 등 일부 서비스 이용에 제한이 발생할 수 있습니다.</p>
              </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제10조 (개인정보 보호책임자)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p>1. 서비스는 이용자의 개인정보 보호에 관한 업무를 총괄하는 개인정보 보호책임자를 지정하고 있습니다.</p>

                <p>2. 개인정보 보호책임자는 다음과 같습니다.</p>
                <div className="space-y-2">
                  <p className={dashItemClassName}>- 책임자: 강신우</p>
                  <p className={dashItemClassName}>- 이메일: connect.music@lydianlarnelllicks.com</p>
                </div>

                <p>3. 이용자는 서비스 이용 중 발생하는 모든 개인정보 보호 관련 문의, 불만 처리, 피해 구제 등에 관한 사항을 개인정보 보호책임장게 문의할 수 있으며, 서비스는 이에 대해 지체 없이 답변 및 처리합니다.</p>
              </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제11조 (개인정보처리방침 변경)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p>1. 본 개인정보처리방침은 관련 법령 또는 서비스 정책의 변경에 따라 변경될 수 있습니다.</p>
                <p>2. 서비스는 개인정보처리방침을 변경하는 경우, 변경 내용과 적용일자를 명시하여 최소 7일 이전부터 서비스 내 공지사항을 통해 사전 안내합니다.</p>
                <p>3. 다만, 이용자의 권리 또는 의무에 중대한 영향을 미치는 변경의 경우에는 최소 30일 이전에 사전 공지합니다.</p>
                <p>4. 변경된 개인정보처리방침은 공지한 적용일자부터 효력이 발생합니다.</p>
              </div>
          </section>

          <section className={sectionClassName}>
            <div className="mb-4">
              <h2 className={titleClassName}>제12조 (개인정보의 국외 이전)</h2>
            </div>
              <div className={`${bodyClassName} space-y-3`}>
                <p>1. 서비스는 원활한 서비스 제공을 위하여 이용자의 개인정보를 국외에 이전할 수 있습니다.</p>

                <p>2. 서비스가 이용자의 개인정보를 국외로 이전하는 경우에는 다음 사항을 개인정보처리방침에 공개하거나 이용자에게 안내합니다.</p>
                <div className="space-y-2">
                  <p className={subItemClassName}>① 이전받는 자</p>
                  <p className={subItemClassName}>② 이전되는 국가</p>
                  <p className={subItemClassName}>③ 이전 일시 및 방법</p>
                  <p className={subItemClassName}>④ 이전되는 개인정보 항목</p>
                  <p className={subItemClassName}>⑤ 이전 목적</p>
                  <p className={subItemClassName}>⑥ 보유 및 이용 기간</p>
                </div>

                <p>3. 서비스는 개인정보의 국외 이전 시 개인정보 보호를 위하여 필요한 안정성 확보 조치 및 고충처리 절차를 마련합니다.</p>
              </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-7">
            <div className="mb-4">
              <h2 className={titleClassName}>부칙</h2>
            </div>
            <div className={`${bodyClassName} space-y-2`}>
              <p>본 방침은 시행일로부터 적용됩니다.</p>
              <p>시행일: 2026년 04월 10일</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}