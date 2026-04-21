import type { HelmetOptions } from "helmet";

const SELF = "'self'";
const NONE = "'none'";
const UNSAFE_INLINE = "'unsafe-inline'";
const DATA = "data:";
const BLOB = "blob:";

export function buildProductionHelmetConfig(): HelmetOptions {
  return {
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },

    // 결제 팝업/외부 인증창 대응
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },

    // false보다 한 단계 덜 완화된 운영형
    crossOriginResourcePolicy: { policy: "same-site" },

    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: [SELF],
        baseUri: [SELF],
        objectSrc: [NONE],

        scriptSrc: [
          SELF,
          UNSAFE_INLINE,
          "https://js.tosspayments.com",
          "https://pay.tosspayments.com",
          "https://*.tosspayments.com",
          "https://static.toss.im",
          "https://www.gstatic.com",
          "https://*.gstatic.com",
          "https://www.vpay.co.kr",
          "https://*.vpay.co.kr",
          "https://www.youtube.com",
          "https://www.youtube.com/iframe_api",
          "https://s.ytimg.com",
        ],

        scriptSrcElem: [
          SELF,
          UNSAFE_INLINE,
          "https://js.tosspayments.com",
          "https://pay.tosspayments.com",
          "https://*.tosspayments.com",
          "https://static.toss.im",
          "https://www.gstatic.com",
          "https://*.gstatic.com",
          "https://www.vpay.co.kr",
          "https://*.vpay.co.kr",
          "https://www.youtube.com",
          "https://www.youtube.com/iframe_api",
          "https://s.ytimg.com",
        ],

        connectSrc: [
          SELF,
          "https://api.tosspayments.com",
          "https://pay.tosspayments.com",
          "https://js.tosspayments.com",
          "https://*.tosspayments.com",
          "https://apigw.tosspayments.com",
          "https://apigw-sandbox.tosspayments.com",
          "https://log.tosspayments.com",
          "https://event.tosspayments.com",
          "https://static.toss.im",
          "https://www.gstatic.com",
          "https://*.gstatic.com",
          "https://www.vpay.co.kr",
          "https://*.vpay.co.kr",
          "https://www.youtube.com",
        ],

        frameSrc: [
          SELF,
          "https://js.tosspayments.com",
          "https://pay.tosspayments.com",
          "https://tosspayments.com",
          "https://*.tosspayments.com",
          "https://*.payco.com",
          "https://*.kcp.co.kr",
          "https://*.inicis.com",
          "https://www.vpay.co.kr",
          "https://*.vpay.co.kr",
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com",
        ],

        childSrc: [
          SELF,
          "https://js.tosspayments.com",
          "https://pay.tosspayments.com",
          "https://tosspayments.com",
          "https://*.tosspayments.com",
          "https://*.payco.com",
          "https://*.kcp.co.kr",
          "https://*.inicis.com",
          "https://www.vpay.co.kr",
          "https://*.vpay.co.kr",
        ],

        formAction: [
          SELF,
          "https://pay.tosspayments.com",
          "https://tosspayments.com",
          "https://*.tosspayments.com",
          "https://*.payco.com",
          "https://*.kcp.co.kr",
          "https://*.inicis.com",
          "https://www.vpay.co.kr",
          "https://*.vpay.co.kr",
        ],

        imgSrc: [
          SELF,
          DATA,
          BLOB,
          "https://i.ytimg.com",
          "https://www.youtube.com",
          "https://static.toss.im",
          "https://tosspayments.com",
          "https://*.tosspayments.com",
          "https://www.vpay.co.kr",
          "https://*.vpay.co.kr",
        ],

        mediaSrc: [SELF, BLOB, "https://www.youtube.com"],

        styleSrc: [
          SELF,
          UNSAFE_INLINE,
          "https://fonts.googleapis.com",
          "https://js.tosspayments.com",
          "https://pay.tosspayments.com",
          "https://static.toss.im",
        ],

        fontSrc: [
          SELF,
          DATA,
          "https://fonts.gstatic.com",
          "https://js.tosspayments.com",
          "https://static.toss.im",
        ],

        // Helmet 기본 frame-ancestors 'self' 유지
        // 외부 사이트에 내 페이지를 iframe 삽입하지 못하게 유지
        frameAncestors: [SELF],
      },
    },

    // 레거시 클릭재킹 방어 유지
    xFrameOptions: { action: "sameorigin" },
  };
}

export function buildDevelopmentHelmetConfig(): HelmetOptions {
  return {
    contentSecurityPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  };
}