const exec = require('child_process').exec;
const gap = require('gulp-append-prepend');
const gulp = require("gulp");
const replace = require('gulp-replace');
const ts = require('gulp-typescript');

const MORO8ASM_EXPORTED_FUNCTIONS = [
    "_malloc",
    "_free",
    "_moro8asm_compile",
];

const dev_build = ((process.env.NODE_ENV || 'development').trim().toLowerCase() === 'development');

/** Compile moro8asm.ts. */
gulp.task("compile-ts", function () {
    return gulp
        .src("./src/moro8asm.ts")
        .pipe(ts.createProject('tsconfig.json')())
        .pipe(gulp.dest("./dist"));
});

gulp.task("compile-wasm", function (cb) {
    exec('emsdk_env & emcc -Ivendor/moro8 vendor/moro8/moro8.c vendor/moro8asm/moro8asm.c -o moro8asm.js ' +
        (dev_build ? '-g ' : '-O3 ') +
        '-s WASM=1 -s MODULARIZE -s EXPORT_NAME="moro8asm" -s NO_FILESYSTEM=1 ' +
        `-s EXPORTED_FUNCTIONS=[${MORO8ASM_EXPORTED_FUNCTIONS.map(_ => `"${_}"`).join(",")}] ` +
        '-s EXPORTED_RUNTIME_METHODS=ccall ' +
        '--post-js dist/moro8asm.js',
        {env: process.env},
        (err, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            cb(err);
        }
    );
});

gulp.task("copy-types", function () {
    return gulp
        .src("./dist/moro8asm.d.ts")
        .pipe(replace("declare let moro8asm: any;\n", ""))
        .pipe(replace("/** Pointer to the C instance. */\n    ", ""))
        .pipe(replace("protected _ptr?: number;\n    ", ""))
        .pipe(replace("private _ptr?;\n    ", ""))
        .pipe(replace("private _memory?;\n    ", ""))
        .pipe(replace("protected _manage_memory: boolean;\n    ", ""))
        .pipe(replace("get ptr(): number | undefined;\n    ", ""))
        .pipe(replace("constructor(ptr?: number);", "constructor();"))
        .pipe(replace("declare", "export"))
        .pipe(gap.prependText('import "emscripten";\n\n'))
        .pipe(gap.appendText(
'\n\nexport interface Moro8ASMModule extends EmscriptenModule {\n' +
'    compile: typeof compile; \n' +
'}\n' +
'\n' +
'declare const factory: () => Promise<Moro8ASMModule>;\n' +
'export default factory;\n'))
        .pipe(gulp.dest("./"));
});

// Build everything
gulp.task("build", gulp.series("compile-ts", "compile-wasm", "copy-types"));
