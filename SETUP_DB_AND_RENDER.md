# Lydian_Larnell_Licks Render 운영 설정 안내

## 핵심 원칙
- Render Web Service + Render PostgreSQL + Render Persistent Disk 기준으로 운영합니다.
- 업로드 루트는 반드시 Persistent Disk mount path 하위여야 합니다.
- mount path는 `/var/data`, 실제 업로드 루트는 `/var/data/uploads`를 사용합니다.
- `thumbnails`, `profile-images`, `videos`만 정적 공개합니다.
- `pdfs`, `contracts`는 정적 공개하지 않고 API 다운로드만 허용합니다.

## 필수 환경변수
```env
NODE_ENV=production
NODE_VERSION=22
DATABASE_URL=<Render Internal Database URL>
SESSION_SECRET=<32자 이상 랜덤 문자열>
DB_SSL_MODE=require
UPLOAD_ROOT=/var/data/uploads
CLIENT_URL=https://your-domain.com
CLIENT_URL_WWW=https://www.your-domain.com
RENDER_EXTERNAL_URL=https://your-render-service.onrender.com
APP_BASE_URL=https://your-domain.com
EMAIL_USER=<smtp account>
EMAIL_PASS=<smtp password>
VITE_TOSS_PAYMENTS_CLIENT_KEY=<toss client key>
TOSS_SECRET_KEY=<toss secret key>
ACCOUNT_ENCRYPTION_KEY=<32자 이상 랜덤 문자열>
SENTRY_DSN=<optional sentry dsn>
ADMIN_ALERT_EMAIL_TO=<admin alert email>
ADMIN_ALERT_EMAIL_FROM=<optional from email>
```

## Render 설정
1. Web Service 생성
2. 같은 리전의 Render PostgreSQL 연결
3. Persistent Disk 추가
   - Mount Path: `/var/data`
   - 앱 저장 경로: `/var/data/uploads`
4. Health Check Path: `/healthz`
5. 데이터베이스 연결은 반드시 Internal URL 사용

## 동작 확인 포인트
1. `/healthz`는 `{ ok: true }`를 반환해야 합니다.
2. `/readyz`는 DB 연결 성공 시 `{ ok: true, db: "up" }`를 반환해야 합니다.
3. PDF와 계약서는 직접 정적 URL 접근이 되지 않아야 합니다.
4. 업로드 파일은 재배포 후에도 Persistent Disk에 남아 있어야 합니다.
5. 결제는 `/api/payments/prepare` → Toss → `/api/payments/confirm` 순서로만 완료되어야 합니다.

## 로컬 실행 주의사항
- zip 안의 `node_modules`는 재설치가 필요할 수 있습니다.
- 운영 배포 전 `npm ci` 후 `npm test` 와 `npm run build`를 반드시 통과시켜야 합니다.
- 운영에서는 기본 관리자 자동 생성을 비활성화하는 편이 안전합니다.


## 백업 / 복구
- Render PostgreSQL 자동 백업이 활성화된 플랜을 사용합니다.
- 운영 전 최소 1회 복구 리허설을 진행합니다.
- 장애 알림은 Sentry 와 관리자 이메일을 함께 사용합니다.
