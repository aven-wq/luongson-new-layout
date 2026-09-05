const fs = require('fs');
const path = require('path');
const cssnano = require('cssnano');
const postcss = require('postcss');
const { minify: minifyJS } = require('terser');

// Directories to process
const subfolders = ['shared', 'cakhia', 'luongson', 'socolive', 'thapcam', 'vebo', 'vebo-v2', 'cakhia-v2'];
const distDir = path.join(__dirname, 'dist');

// Local backup/reference files — never include in production bundles.
const EXCLUDED_BUILD_FILES = new Set([
    'trangchu-backup.js',
    'trangchu-backup.css',
]);

function shouldExcludeBuildFile(file) {
    if (EXCLUDED_BUILD_FILES.has(file)) {
        return true;
    }
    // Also skip any other *-backup.* assets by convention.
    return /-backup\.(js|css)$/i.test(file);
}

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Collect all CSS files
async function collectCSSFiles() {
    const cssFiles = [];

    for (const folder of subfolders) {
        const folderPath = path.join(__dirname, folder);
        if (!fs.existsSync(folderPath)) continue;

        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            if (file.endsWith('.css') && !shouldExcludeBuildFile(file)) {
                const filePath = path.join(folderPath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                cssFiles.push({
                    path: filePath,
                    content: content,
                    name: file
                });
            }
        }
    }

    return cssFiles;
}

// Collect all JS files
async function collectJSFiles() {
    const jsFiles = [];

    for (const folder of subfolders) {
        const folderPath = path.join(__dirname, folder);
        if (!fs.existsSync(folderPath)) continue;

        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            if (file.endsWith('.js') && !shouldExcludeBuildFile(file)) {
                const filePath = path.join(folderPath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                jsFiles.push({
                    path: filePath,
                    content: content,
                    name: file
                });
            }
        }
    }

    return jsFiles;
}

// Bundle and minify CSS
async function bundleCSS() {
    console.log('📦 Collecting CSS files...');
    const cssFiles = await collectCSSFiles();

    if (cssFiles.length === 0) {
        console.log('⚠️  No CSS files found!');
        return;
    }

    console.log(`Found ${cssFiles.length} CSS files:`);
    cssFiles.forEach(file => console.log(`  - ${file.name}`));

    // Bundle all CSS
    console.log('\n🔗 Bundling CSS...');
    let bundledCSS = '';
    cssFiles.forEach((file, index) => {
        bundledCSS += `/* ${file.name} */\n${file.content}\n\n`;
    });

    // Write normal (unminified) version
    const normalCSSPath = path.join(distDir, 'dv2-style.css');
    fs.writeFileSync(normalCSSPath, bundledCSS, 'utf8');
    const originalSize = Buffer.byteLength(bundledCSS, 'utf8');
    console.log(`✅ Normal CSS bundled!`);
    console.log(`   Size: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Output: ${normalCSSPath}`);

    // Minify CSS
    console.log('\n✨ Minifying CSS...');
    try {
        const result = await postcss([cssnano({ preset: 'default' })]).process(bundledCSS, {
            from: undefined
        });

        const minifiedCSSPath = path.join(distDir, 'dv2-style.min.css');
        fs.writeFileSync(minifiedCSSPath, result.css, 'utf8');

        const minifiedSize = Buffer.byteLength(result.css, 'utf8');
        const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);

        console.log(`✅ Minified CSS created!`);
        console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`   Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
        console.log(`   Savings: ${savings}%`);
        console.log(`   Output: ${minifiedCSSPath}`);
    } catch (error) {
        console.error('❌ Error minifying CSS:', error);
        console.log(`⚠️  Minified version not created, but normal version is available at ${normalCSSPath}`);
    }
}

// Bundle and minify JS
async function bundleJS() {
    console.log('\n📦 Collecting JS files...');
    const jsFiles = await collectJSFiles();

    if (jsFiles.length === 0) {
        console.log('⚠️  No JS files found!');
        return;
    }

    console.log(`Found ${jsFiles.length} JS files:`);
    jsFiles.forEach(file => console.log(`  - ${file.name}`));

    // Bundle all JS - wrap each file in IIFE to scope variables
    console.log('\n🔗 Bundling JS...');
    let bundledJS = '';

    // Functions that need to be exposed globally (called from HTML onclick handlers)
    const globalFunctionWhitelist = new Set([
        'goToMatchDetail',
        'goToBLVPage',
        'viewHighlight'
    ]);

    // Wrap each file in IIFE to create isolated scope
    // Only expose functions that are explicitly needed (called from HTML but not already assigned to window)
    jsFiles.forEach((file, index) => {
        // Find functions that are already explicitly assigned to window in the original code
        // These will automatically be exposed via the window parameter, so we don't need to expose them again
        const windowAssignments = file.content.match(/window\.(\w+)\s*=/g) || [];
        const explicitWindowFunctions = new Set(
            windowAssignments.map(m => m.match(/window\.(\w+)/)[1])
        );

        // Find top-level function declarations
        const functionMatches = file.content.match(/^\s*function\s+(\w+)\s*\(/gm) || [];
        const topLevelFunctions = functionMatches.map(m => {
            const match = m.match(/function\s+(\w+)/);
            return match ? match[1] : null;
        }).filter(Boolean);

        // Only expose functions that are:
        // 1. In the whitelist (called from HTML), AND
        // 2. NOT already explicitly assigned to window (those are handled automatically)
        const functionsToExpose = topLevelFunctions.filter(fn =>
            globalFunctionWhitelist.has(fn) && !explicitWindowFunctions.has(fn)
        );

        // Create exposure code only for needed functions
        const exposeCode = functionsToExpose.length > 0
            ? `\n// Expose required functions to global scope\n${functionsToExpose.map(fn => `window.${fn} = ${fn};`).join('\n')}`
            : '';

        bundledJS += `/* ${file.name} */\n(function(window, $, jQuery, Hls, Swiper) {\n${file.content}${exposeCode}\n})(window, window.jQuery || window.$, window.jQuery || window.$, window.Hls, window.Swiper);\n\n`;
    });

    // Write normal (unminified) version
    const normalJSPath = path.join(distDir, 'dv2-script.js');
    fs.writeFileSync(normalJSPath, bundledJS, 'utf8');
    const originalSize = Buffer.byteLength(bundledJS, 'utf8');
    console.log(`✅ Normal JS bundled!`);
    console.log(`   Size: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Output: ${normalJSPath}`);

    // Minify JS - now we can minify safely since variables are scoped
    console.log('\n✨ Minifying JS...');
    try {
        const result = await minifyJS(bundledJS, {
            compress: {
                drop_console: false,
                drop_debugger: true,
                passes: 2,
            },
            format: {
                comments: false,
            },
            mangle: {
                reserved: ['$', 'jQuery', 'Hls', 'Swiper', 'window', 'document', 'console', 'sclInitHLSPlayer', 'DV2_StreamChrome', 'DV2StreamKickoff', 'DV2MatchSort', 'DV2HotLeagues', 'DV2MatchScorePoll', 'DV2SocoliveHotLive', 'DV2StreamLinks', 'DV2StreamTvc', 'DV2BlvDropdown', 'DV2ListAds', 'dv2Streaming']
            },
            keep_classnames: true,
            keep_fnames: true,
        });

        if (result.error) {
            throw result.error;
        }

        const minifiedJSPath = path.join(distDir, 'dv2-script.min.js');
        fs.writeFileSync(minifiedJSPath, result.code, 'utf8');

        const minifiedSize = Buffer.byteLength(result.code, 'utf8');
        const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);

        console.log(`✅ Minified JS created!`);
        console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`   Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
        console.log(`   Savings: ${savings}%`);
        console.log(`   Output: ${minifiedJSPath}`);
    } catch (error) {
        console.error('❌ Error minifying JS:', error);
        console.log(`⚠️  Minified version not created, but normal version is available at ${normalJSPath}`);
    }
}

// Main function
async function build() {
    console.log('🚀 Starting build process...\n');

    try {
        await bundleCSS();
        await bundleJS();
        console.log('\n🎉 Build complete!');
        return true;
    } catch (error) {
        console.error('\n❌ Build failed:', error);
        if (require.main === module) {
            process.exit(1);
        }
        return false;
    }
}

// Export functions for use in watch mode
module.exports = {
    build,
    bundleCSS,
    bundleJS,
    subfolders,
    distDir
};

// Run build if this file is executed directly
if (require.main === module) {
    build();
}

