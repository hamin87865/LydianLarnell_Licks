# 2026-04-09 보강 내용

## 반영한 항목
- 계좌번호 암호화 유틸 추가 (`server/lib/accountCrypto.ts`)
- 뮤지션 지원서 저장 시 계좌번호 암호화 + last4 별도 저장
- 관리자/정산 응답은 마스킹 유지, 관리자 전용 정산 스냅샷은 복호화 기반 상세값 유지
- 명시적 SQL migration 체계 추가 (`server/migrations`, `scripts/db-migrate.ts`, `npm run db:migrate`)
- smoke check 스크립트 추가 (`npm run smoke:check`)
- 운영 환경 env 검증에 `ACCOUNT_ENCRYPTION_KEY` 추가
- 회귀 방지 테스트 보강 (`tests/*.test.*` 추가)

## 제한 사항
- 이 환경에서는 실제 Render/Postgres/Toss/Gmail 연동까지 끝단 실행 검증은 수행하지 못했습니다.
- 추가된 테스트는 회귀 방지용 자동화 테스트 중심이며, 실제 브라우저 기반 풀 E2E(Cypress/Playwright)까지는 포함하지 않았습니다.
- 기존 평문 계좌번호 데이터는 복호화 불가하므로, 암호화 키 도입 후 새 저장분부터 안전해지고 기존 데이터는 fallback 읽기 후 재저장/백필이 필요합니다.
