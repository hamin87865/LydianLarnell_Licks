# 장애 점검 체크리스트

## 공통
1. `/healthz` 응답 확인
2. `/readyz` 응답 확인
3. Render 로그 확인
4. 최근 배포 여부 확인

## 로그인/세션 장애
1. `SESSION_SECRET` 변경 여부 확인
2. PostgreSQL 세션 테이블 접근 가능 여부 확인
3. 브라우저 쿠키 삭제 후 재시도

## 이메일 발송 장애
1. `npm run verify:integrations`
2. SMTP verify 실패 메시지 확인
3. Gmail 앱 비밀번호 재발급 여부 확인
4. 발신 제한 또는 rate limit 여부 확인

## 결제 장애
1. `/api/payments/prepare` 응답 확인
2. Toss 키 쌍 설정 확인
3. `payment_audit_logs` 확인
4. successUrl / failUrl 기준 도메인 확인

## 파일/업로드 장애
1. Render Disk 마운트 경로 확인
2. `UPLOAD_ROOT` 확인
3. `.diagnostics/render-disk-check.txt` 생성/갱신 확인
4. 누락 파일이면 서버 로그와 사용자 메시지를 분리해 확인
