const esbuild = require('esbuild');
const { BuildOptions } = require('./common.js');
const rimraf = require('rimraf');

rimraf.sync(BuildOptions.outdir);

esbuild
    .build({
        ...BuildOptions
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .then(() => process.exit(0));