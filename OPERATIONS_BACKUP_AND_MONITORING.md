# 운영 모니터링 / 백업 설정 체크리스트

## 1. Sentry 연동
- 환경변수 `SENTRY_DSN` 설정
- 서버 오류 발생 시 Sentry envelope 전송
- 운영 5xx 오류는 관리자 알림 이메일과 함께 수신되는지 확인

## 2. 관리자 알림 이메일
- `EMAIL_USER`, `EMAIL_PASS` 설정
- `ADMIN_ALERT_EMAIL_TO` 지정
- 필요 시 `ADMIN_ALERT_EMAIL_FROM` 별도 지정

## 3. Render 백업
- Render PostgreSQL 자동 백업이 켜진 플랜 사용
- 백업 주기와 보존 기간을 Render 콘솔에서 확인
- 최소 월 1회 복구 리허설 수행

## 4. 배포 전 점검
- `npm ci`
- `npm test`
- `npm run build`
- `/healthz`, `/readyz`, `/api/contents` 스모크 체크

## 5. 장애 대응 우선순위
1. DB 연결 장애
2. 로그인/세션 장애
3. 결제 prepare/confirm 장애
4. 정산 지급 장애
5. 관리자 페이지 데이터 반영 장애
