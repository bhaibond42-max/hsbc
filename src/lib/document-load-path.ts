const STORAGE_KEY = "documentLoadPath";
const SKIP_LOGIN_SPLASH_KEY = "skipLoginSplash";

let capturedThisDocument = false;
let forceLoginReloadHandled = false;

/** Ensures the refresh → log off check runs at most once per full page load (avoids remount loops). */
export function shouldRunForceLoginOnReload() {
  if (forceLoginReloadHandled) return false;
  forceLoginReloadHandled = true;
  return true;
}

/** Records the URL path from the first paint of this full page load (not client navigations). */
export function captureDocumentLoadPath(pathname: string) {
  if (capturedThisDocument) return;
  capturedThisDocument = true;
  try {
    sessionStorage.setItem(STORAGE_KEY, pathname);
  } catch {
    /* private mode */
  }
}

export function setDocumentLoadPath(pathname: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, pathname);
  } catch {
    /* private mode */
  }
}

export function getDocumentLoadPath(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function skipNextLoginSplash() {
  try {
    sessionStorage.setItem(SKIP_LOGIN_SPLASH_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function consumeSkipLoginSplash(): boolean {
  try {
    if (sessionStorage.getItem(SKIP_LOGIN_SPLASH_KEY) !== "1") return false;
    sessionStorage.removeItem(SKIP_LOGIN_SPLASH_KEY);
    return true;
  } catch {
    return false;
  }
}
