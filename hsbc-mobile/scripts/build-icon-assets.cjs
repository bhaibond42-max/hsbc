/**
 * Builds square launcher icons from icon-master.png.
 * Android adaptive icons crop the outer ~18%, so the artwork is scaled up
 * to keep the hex + UK readable on the home screen.
 */
const fs = require("fs");
const path = require("path");
const {
  generateImageAsync,
  generateImageBackgroundAsync,
  compositeImagesAsync,
} = require("@expo/image-utils");

const projectRoot = path.join(__dirname, "..");
const assetsDir = path.join(projectRoot, "assets");
const masterPath = path.join(assetsDir, "icon-master.png");
const iconPath = path.join(assetsDir, "icon.png");
const foregroundPath = path.join(assetsDir, "android-icon-foreground.png");

const CANVAS = 1024;
const BG = "#ebebeb";
/** Scale past 100% so the logo fills more of the visible safe zone. */
const LOGO_SCALE = 1.28;

async function buildPaddedIcon() {
  if (!fs.existsSync(masterPath)) {
    throw new Error("Missing assets/icon-master.png");
  }

  const logoSize = Math.round(CANVAS * LOGO_SCALE);
  const offset = Math.round((CANVAS - logoSize) / 2);

  const background = await generateImageBackgroundAsync({
    width: CANVAS,
    height: CANVAS,
    backgroundColor: BG,
  });

  const { source: logo } = await generateImageAsync(
    { projectRoot, cacheType: "hsbc-icon-larger" },
    {
      src: masterPath,
      width: logoSize,
      height: logoSize,
      resizeMode: "contain",
      backgroundColor: BG,
    },
  );

  const padded = await compositeImagesAsync({
    background,
    foreground: logo,
    x: offset,
    y: offset,
  });

  fs.writeFileSync(iconPath, padded);
  fs.writeFileSync(foregroundPath, padded);
  fs.writeFileSync(path.join(assetsDir, "splash-icon.png"), padded);
  fs.copyFileSync(iconPath, path.join(assetsDir, "favicon.png"));
  console.log(`Wrote larger launcher icons (${Math.round(LOGO_SCALE * 100)}% scale)`);
}

buildPaddedIcon().catch((err) => {
  console.error(err);
  process.exit(1);
});
