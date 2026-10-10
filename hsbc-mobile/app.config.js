/** @type {import('expo/config').ExpoConfig} */
export default {
  expo: {
    name: "HSBC UK",
    slug: "hsbc-uk",
    version: "1.0.4",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hsbcuk.mobile",
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },
      },
    },
    android: {
      package: "com.hsbcuk.mobile",
      versionCode: 5,
      usesCleartextTraffic: true,
      adaptiveIcon: {
        backgroundColor: "#ebebeb",
        foregroundImage: "./assets/android-icon-foreground.png",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      siteUrl: (process.env.EXPO_PUBLIC_SITE_URL ?? "https://hsbc-bank-dun.vercel.app").replace(/\/$/, ""),
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
  },
};
