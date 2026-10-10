/**
 * Regenerates Android launcher mipmaps from app.config.js icon assets.
 */
const path = require("path");
const { getConfig } = require("@expo/config");
const { withAndroidIcons } = require("@expo/prebuild-config/build/plugins/icons/withAndroidIcons");
const { withMod, createRunOncePlugin } = require("@expo/config-plugins");

const projectRoot = path.join(__dirname, "..");

async function main() {
  const { exp: config } = getConfig(projectRoot, { skipSDKVersionRequirement: true });
  const plugin = createRunOncePlugin(withAndroidIcons, "regenerate-android-icons");
  let next = plugin(config);

  const dangerousMods = [];
  const collect = (cfg) => {
    if (cfg.mods?.android) {
      for (const [modName, modFn] of Object.entries(cfg.mods.android)) {
        if (modName === "dangerous") {
          dangerousMods.push(...(Array.isArray(modFn) ? modFn : [modFn]));
        }
      }
    }
    return cfg;
  };
  collect(next);

  if (!dangerousMods.length) {
    throw new Error("No android dangerous mods registered for icons.");
  }

  for (const mod of dangerousMods) {
    await mod({
      modRequest: { projectRoot, platform: "android", platformProjectRoot: path.join(projectRoot, "android") },
      modResults: null,
    });
  }

  await ensureRoundLauncherResources(projectRoot);
  console.log("Android launcher icons updated.");
}

async function ensureRoundLauncherResources(projectRoot) {
  const fs = require("fs");
  const resRoot = path.join(projectRoot, "android", "app", "src", "main", "res");
  const dpis = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];
  for (const dpi of dpis) {
    const dir = path.join(resRoot, `mipmap-${dpi}`);
    const launcher = path.join(dir, "ic_launcher.webp");
    const round = path.join(dir, "ic_launcher_round.webp");
    if (fs.existsSync(launcher) && !fs.existsSync(round)) {
      fs.copyFileSync(launcher, round);
    }
  }
  const anydpi = path.join(resRoot, "mipmap-anydpi-v26");
  fs.mkdirSync(anydpi, { recursive: true });
  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/iconBackground"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anydpi, "ic_launcher.xml"), adaptiveXml);
  fs.writeFileSync(path.join(anydpi, "ic_launcher_round.xml"), adaptiveXml);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
