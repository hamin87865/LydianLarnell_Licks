# 환경변수 설정 가이드

## 필수
- `DATABASE_URL`: Render PostgreSQL 연결 문자열
- `SESSION_SECRET`: 세션 서명 키
- `ACCOUNT_ENCRYPTION_KEY`: 계좌번호 암호화 키
- `UPLOAD_ROOT`: Render Disk 마운트 경로
- `VITE_TOSS_PAYMENTS_CLIENT_KEY`: Toss 클라이언트 키
- `TOSS_PAYMENTS_SECRET_KEY` 또는 `TOSS_SECRET_KEY`: Toss 서버 시크릿 키
- `EMAIL_USER`: SMTP 발신 계정
- `EMAIL_PASS`: SMTP 앱 비밀번호

## 권장
- `APP_BASE_URL`: 외부 접근 기준 URL
- `RENDER_EXTERNAL_URL`: Render 기본 URL
- `EMAIL_HOST`: SMTP 호스트, 기본값 `smtp.gmail.com`
- `EMAIL_PORT`: SMTP 포트, 기본값 `465`
- `EMAIL_SECURE`: `true` 또는 `false`
- `ADMIN_ALERT_EMAIL_TO`: 장애 알림 수신 메일
- `ADMIN_ALERT_EMAIL_FROM`: 장애 알림 발신 메일

## 운영 안전 설정
- `NODE_ENV=production`
- `CREATE_DEFAULT_ADMIN=false`
- `SKIP_DEFAULT_ADMIN=true`

운영에서 기본 관리자 자동 생성을 막으려면 위 두 값을 명시적으로 유지하십시오.
