import * as esbuild from 'esbuild'
import {BuildOptions} from './common.js';
const rimraf = require('rimraf');

rimraf.sync(BuildOptions.outdir);

/** @type {esbuild.BuildContext} */
const context = await esbuild.context({
    ...BuildOptions,
});

await context.watch();