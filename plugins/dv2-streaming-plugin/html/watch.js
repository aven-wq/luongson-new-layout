const chokidar = require('chokidar');
const path = require('path');
const { build, subfolders } = require('./build');

// Check if --serve flag is passed
const shouldServe = process.argv.includes('--serve');

// Watch patterns - watch JS, CSS, and HTML files
const watchPatterns = subfolders.map(folder => path.join(__dirname, folder, '**/*.{js,css,html}'));

// Debounce function to avoid multiple builds
let buildTimeout = null;
const DEBOUNCE_DELAY = 300; // ms

async function triggerBuild(changedFile) {
    // Clear existing timeout
    if (buildTimeout) {
        clearTimeout(buildTimeout);
    }
    
    // Set new timeout
    buildTimeout = setTimeout(async () => {
        const fileExt = path.extname(changedFile).toLowerCase();
        const isHTML = fileExt === '.html';
        
        console.log(`\n📝 File changed: ${path.relative(__dirname, changedFile)}`);
        
        // If HTML file, just reload browser (no rebuild needed)
        if (isHTML && shouldServe && browserSync) {
            console.log('🔄 Reloading browser...\n');
            browserSync.reload();
            return;
        }
        
        // For JS/CSS files, rebuild
        console.log('🔄 Rebuilding...\n');
        const success = await build();
        
        if (success && shouldServe && browserSync) {
            // Reload browser after successful build
            browserSync.reload();
        }
    }, DEBOUNCE_DELAY);
}

// Initialize watcher
console.log('👀 Watching for file changes...\n');
console.log('Watching directories:');
subfolders.forEach(folder => console.log(`  - ${folder}/`));
console.log('\nPress Ctrl+C to stop watching\n');

const watcher = chokidar.watch(watchPatterns, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true
});

// Watch events
watcher
    .on('add', triggerBuild)
    .on('change', triggerBuild)
    .on('unlink', triggerBuild)
    .on('error', error => console.error('❌ Watcher error:', error));

// Initial build
console.log('🚀 Running initial build...\n');
build().then(() => {
    if (shouldServe) {
        startBrowserSync();
    }
});

// Browser Sync setup
let browserSync = null;

function startBrowserSync() {
    try {
        const browserSyncLib = require('browser-sync').create();
        browserSync = browserSyncLib;
        
        // Use root directory as base - this allows serving files from subfolders
        // Files will be accessible at: /subfolder/filename.html
        browserSync.init({
            server: {
                baseDir: __dirname,  // Serve from project root
                index: 'index.html',
                directory: false,  // Don't show directory listing
                serveStaticOptions: {
                    extensions: ['html']  // Default to .html if no extension
                }
            },
            files: [
                // Watch HTML files in subfolders for reload
                ...subfolders.map(folder => path.join(__dirname, folder, '**/*.html')),
                // Watch dist files for reload
                path.join(__dirname, 'dist', '**/*.css'),
                path.join(__dirname, 'dist', '**/*.js')
            ],
            watchOptions: {
                ignoreInitial: true
            },
            open: false,
            notify: false,
            logLevel: 'silent',
            port: 3002
        }, (err, bs) => {
            if (err) {
                console.error('❌ Browser Sync error:', err);
                return;
            }
            
            const port = bs.options.get('port');
            console.log('\n🌐 Live reload server started!');
            console.log(`   Local: http://localhost:${port}`);
            console.log(`   External: http://${bs.options.get('host')}:${port}`);
            console.log('\n📁 You can access HTML files from subfolders:');
            
            // List actual HTML files found
            const fs = require('fs');
            subfolders.forEach(folder => {
                const folderPath = path.join(__dirname, folder);
                if (fs.existsSync(folderPath)) {
                    const htmlFiles = fs.readdirSync(folderPath)
                        .filter(file => file.endsWith('.html'))
                        .slice(0, 5); // Show first 5 files per folder
                    
                    if (htmlFiles.length > 0) {
                        console.log(`\n   ${folder}/:`);
                        htmlFiles.forEach(file => {
                            console.log(`      http://localhost:${port}/${folder}/${file}`);
                        });
                    }
                }
            });
            
            console.log(`\n   Bundled files:`);
            console.log(`      http://localhost:${port}/dist/dv2-style.css`);
            console.log(`      http://localhost:${port}/dist/dv2-script.js`);
            console.log('\n');
        });
    } catch (error) {
        console.error('❌ Failed to start Browser Sync:', error.message);
        console.log('💡 Make sure browser-sync is installed: npm install');
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping watcher...');
    watcher.close();
    if (browserSync) {
        browserSync.exit();
    }
    process.exit(0);
});

