import type { HelmetOptions } from "helmet";

const SELF = "'self'";
const UNSAFE_INLINE = "'unsafe-inline'";
const DATA = "data:";
const BLOB = "blob:";

export function buildProductionHelmetConfig(): HelmetOptions {
  return {
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },

    // 핵심 1
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },

    // 핵심 2
    // 외부 결제 리소스/새창 흐름에서 걸리면 false로 끄는 쪽이 가장 확실
    crossOriginResourcePolicy: false,

    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: [SELF],
        baseUri: [SELF],
        objectSrc: ["'none'"],

        scriptSrc: [
          SELF,
          UNSAFE_INLINE,
          "https://js.tosspayments.com",
          "https://pay.tosspayments.com",
          "https://*.tosspayments.com",
          "https://static.toss.im",
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
          "https://www.vpay.co.kr",
          "https://*.vpay.co.kr",
        ],

        formAction: [
          SELF,
          "https://pay.tosspayments.com",
          "https://tosspayments.com",
          "https://*.tosspayments.com",
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
      },
    },
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