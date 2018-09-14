const workboxBuild = require("workbox-build");

// NOTE: This should be run *AFTER* all your assets are built
const buildSW = async () => {
    console.log("Generating sw.js...");

    const { count, size, warnings } = await workboxBuild.injectManifest({
        swSrc: "src/sw.js",
        swDest: "build/sw.js",
        globDirectory: "build",
        globPatterns: ["**/*.{js,css,html}", "fonts/*", "img/logos/*.png"],
    });

    warnings.forEach(console.warn);
    console.log(`${count} files will be precached, totaling ${size} bytes.`);
};

buildSW();
