import type { HelmetOptions } from "helmet";

const SELF = "'self'";
const UNSAFE_INLINE = "'unsafe-inline'";
const DATA = "data:";
const BLOB = "blob:";

export function buildProductionHelmetConfig(): HelmetOptions {
  return {
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
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
          "https://payment-widget.tosspayments.com",
          "https://payment-gateway.tosspayments.com",
          "https://payment-gateway-sandbox.tosspayments.com",
          "https://www.youtube.com",
          "https://www.youtube.com/iframe_api",
          "https://s.ytimg.com",
        ],

        scriptSrcElem: [
          SELF,
          UNSAFE_INLINE,
          "https://js.tosspayments.com",
          "https://pay.tosspayments.com",
          "https://payment-widget.tosspayments.com",
          "https://payment-gateway.tosspayments.com",
          "https://payment-gateway-sandbox.tosspayments.com",
          "https://www.youtube.com",
          "https://www.youtube.com/iframe_api",
          "https://s.ytimg.com",
        ],

        connectSrc: [
          SELF,
          "https://api.tosspayments.com",
          "https://pay.tosspayments.com",
          "https://js.tosspayments.com",
          "https://payment-widget.tosspayments.com",
          "https://payment-gateway.tosspayments.com",
          "https://payment-gateway-sandbox.tosspayments.com",
          "https://apigw.tosspayments.com",
          "https://apigw-sandbox.tosspayments.com",
          "https://log.tosspayments.com",
          "https://event.tosspayments.com",
          "https://static.toss.im",
          "https://www.youtube.com",
        ],

        frameSrc: [
          SELF,
          "https://js.tosspayments.com",
          "https://pay.tosspayments.com",
          "https://tosspayments.com",
          "https://payment-widget.tosspayments.com",
          "https://payment-gateway.tosspayments.com",
          "https://payment-gateway-sandbox.tosspayments.com",
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com",
        ],

        childSrc: [
          SELF,
          "https://js.tosspayments.com",
          "https://pay.tosspayments.com",
          "https://tosspayments.com",
          "https://payment-widget.tosspayments.com",
          "https://payment-gateway.tosspayments.com",
          "https://payment-gateway-sandbox.tosspayments.com",
        ],

        formAction: [
          SELF,
          "https://pay.tosspayments.com",
          "https://tosspayments.com",
          "https://payment-widget.tosspayments.com",
          "https://payment-gateway.tosspayments.com",
          "https://payment-gateway-sandbox.tosspayments.com",
        ],

        imgSrc: [
          SELF,
          DATA,
          BLOB,
          "https://i.ytimg.com",
          "https://www.youtube.com",
          "https://static.toss.im",
          "https://tosspayments.com",
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
  };
}