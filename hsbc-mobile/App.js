import { useMemo, useState } from "react";
import { Image, StatusBar as RNStatusBar, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";

const DEFAULT_SITE = "https://hsbc-bank-dun.vercel.app";

function resolveSiteUrl() {
  return (process.env.EXPO_PUBLIC_SITE_URL ?? DEFAULT_SITE).replace(/\/$/, "");
}

const DISABLE_ZOOM = `
(function () {
  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
  }
  meta.setAttribute(
    'content',
    'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover'
  );
  document.documentElement.style.touchAction = 'manipulation';
  document.body.style.touchAction = 'manipulation';
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturechange', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });
})();
true;
`;

export default function App() {
  const site = useMemo(() => resolveSiteUrl(), []);
  const [failed, setFailed] = useState(false);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <WebView
        source={{ uri: `${site}/login` }}
        style={styles.web}
        originWhitelist={["*"]}
        startInLoadingState
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        scalesPageToFit={false}
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        setSupportMultipleWindows={false}
        injectedJavaScript={DISABLE_ZOOM}
        injectedJavaScriptBeforeContentLoaded={DISABLE_ZOOM}
        renderLoading={() => (
          <View style={styles.loading}>
            <Image
              source={{ uri: `${site}/brand/hsbc-splash-uk.png` }}
              style={styles.openingLogo}
              resizeMode="contain"
              accessibilityLabel="HSBC"
            />
          </View>
        )}
        onError={() => setFailed(true)}
        onHttpError={(event) => {
          if (event.nativeEvent.statusCode >= 400) setFailed(true);
        }}
      />
      {failed ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Cannot open the bank</Text>
          <Text style={styles.noticeBody}>
            Check your internet connection. The app loads {site}. Close and open the app again, or try in your browser.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: RNStatusBar.currentHeight ?? 0,
  },
  web: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  openingLogo: {
    width: 160,
    height: 160,
  },
  notice: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  noticeTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  noticeBody: {
    marginTop: 8,
    textAlign: "center",
    color: "#333",
    lineHeight: 22,
  },
});
