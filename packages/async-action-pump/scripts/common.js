const esbuild = require('esbuild');
const path = require('path');
const glob = require("glob")


const artifactsDir = 'artifacts';
const buildOutDir = `${artifactsDir}/dist/lib`;

const projectDir = path.resolve(__dirname, '..');
const sourceDir = path.join(projectDir, 'src');

/** @type {esbuild.BuildOptions} */
const PlatformOptions = {
    platform: 'node',
    sourcemap: true,
};


/** @type {esbuild.BuildOptions} */
const BuildOptions = {
    ...PlatformOptions,
    tsconfig: path.join(projectDir, 'tsconfig.json'),
    sourceRoot: sourceDir,
    outdir: buildOutDir,
    entryPoints: getTsFiles(),
};


module.exports = {
    BuildOptions,
};

function getTsFiles() {
    return glob.sync(`${sourceDir}/**/*.ts`, {
        ignore: [
            `*.d.ts`,
            `**/*.test.ts`,
        ],
    });
}
