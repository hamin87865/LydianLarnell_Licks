import { normalizeOptionalText } from "./validators";

export interface RuntimeEnvValidationResult {
  errors: string[];
  warnings: string[];
}

function hasValue(value: string | undefined | null) {
  return Boolean(normalizeOptionalText(value));
}

export function validateRuntimeEnv(env: NodeJS.ProcessEnv = process.env): RuntimeEnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = env.NODE_ENV === "production";

  if (!hasValue(env.DATABASE_URL)) {
    errors.push("DATABASE_URL 환경변수가 설정되지 않았습니다.");
  }

  const sessionSecret = normalizeOptionalText(env.SESSION_SECRET) || normalizeOptionalText(env.JWT_SECRET);
  if (isProduction) {
    if (!sessionSecret) {
      errors.push("운영 환경에서는 SESSION_SECRET 환경변수가 반드시 필요합니다.");
    } else if (sessionSecret.length < 32) {
      errors.push("운영 환경에서는 SESSION_SECRET 길이가 32자 이상이어야 합니다.");
    }
  }

  const emailUser = hasValue(env.EMAIL_USER);
  const emailPass = hasValue(env.EMAIL_PASS);
  if (emailUser !== emailPass) {
    errors.push("EMAIL_USER 와 EMAIL_PASS 는 함께 설정되어야 합니다.");
  }

  const tossServerKey = hasValue(env.TOSS_SECRET_KEY) || hasValue(env.TOSS_PAYMENTS_SECRET_KEY);
  const tossClientKey = hasValue(env.VITE_TOSS_PAYMENTS_CLIENT_KEY) || hasValue(env.TOSS_CLIENT_KEY);
  if (tossServerKey !== tossClientKey) {
    errors.push("토스 결제 연동은 VITE_TOSS_PAYMENTS_CLIENT_KEY(또는 TOSS_CLIENT_KEY) 와 TOSS_SECRET_KEY(또는 TOSS_PAYMENTS_SECRET_KEY)를 함께 설정해야 합니다.");
  }

  if (isProduction && !hasValue(env.UPLOAD_ROOT)) {
    errors.push("운영 환경에서는 UPLOAD_ROOT 환경변수가 필요합니다.");
  }

  if (isProduction && !hasValue(env.ACCOUNT_ENCRYPTION_KEY)) {
    errors.push("운영 환경에서는 ACCOUNT_ENCRYPTION_KEY 환경변수가 필요합니다.");
  }

  if (isProduction && env.CREATE_DEFAULT_ADMIN === "true") {
    errors.push("운영 환경에서는 CREATE_DEFAULT_ADMIN=true 를 사용할 수 없습니다.");
  }

  if (isProduction && !hasValue(env.DEFAULT_ADMIN_PASSWORD) && env.CREATE_DEFAULT_ADMIN === "true") {
    errors.push("기본 관리자 생성 시 DEFAULT_ADMIN_PASSWORD 환경변수가 필요합니다.");
  }

  if (isProduction && !hasValue(env.APP_BASE_URL)) {
    warnings.push("운영 환경에서 APP_BASE_URL 이 없으면 이메일/리다이렉트 링크가 잘못될 수 있습니다.");
  }

  if (isProduction && !hasValue(env.CLIENT_URL)) {
    warnings.push("운영 환경에서 CLIENT_URL 이 없으면 CORS 허용 도메인 구성이 불완전할 수 있습니다.");
  }

  return { errors, warnings };
}

export function assertRuntimeEnv(env: NodeJS.ProcessEnv = process.env) {
  const result = validateRuntimeEnv(env);
  if (result.errors.length > 0) {
    throw new Error(result.errors.join(" "));
  }
  return result;
}
