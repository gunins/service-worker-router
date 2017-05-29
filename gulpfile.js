const gulp = require('gulp'),
    rollup = require('rollup-stream'),
    source = require('vinyl-source-stream'),
    del = require('del'),
    fs = require('fs'),
    includePaths = require('rollup-plugin-includepaths'),
    forceBinding = require('rollup-plugin-force-binding'),
    path = require('path'),
    mocha = require('gulp-mocha'),
    sequence = require('run-sequence'),
    async = require('rollup-plugin-async'),
    exec = require('child_process').exec,
    through = require('through2'),
    babili = require("gulp-babili");


//function for taking streams and returning streams;
let chain = (cb) => {
    return through.obj(function(chunk, enc, next) {
        let push = this.push.bind(this);
        cb(chunk, enc).pipe(through.obj((chunk, enc, done) => {
            push(chunk);
            done();
            next();
        }))
    });
};

let getFiles = (dir, files_) => {
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
};

let excludePaths = getFiles(process.cwd() + '/src');

// extension for rollup, for executing any file in directory from src
let rollupStream = (srcDir) => chain((chunk) => {
    let dir = srcDir[srcDir.length - 1] === '/' ? srcDir.substring(0, srcDir.length - 1) : srcDir,
        baseDir = process.cwd() + dir + '/',
        {path} = chunk,
        moduleName = path.replace(baseDir, ''),
        excluded = excludePaths.filter(file => file !== path);
    return rollup({
        entry:      path,
        format:     'cjs',
        moduleName: moduleName,
    }).pipe(source(moduleName));
});


gulp.task('clean', () => {
    return del([
        './dist',
        './target'
    ]);
});


let watcher = gulp.task('watch', function() {
    // Callback mode, useful if any plugin in the pipeline depends on the `end`/`flush` event
    return gulp.watch('./src/**/*.js', ['main']);
});

watcher.on('change', function(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
});

gulp.task('copy', () => {
    return gulp.src(['./config/package.json']).pipe(gulp.dest('./functions'));
});

gulp.task('router', () => {
    return rollup({
        entry:      './src/Router.js',
        format:     'iife',
        moduleName: 'utils',
        plugins:    [
            async()
        ]
    }).pipe(source('Router.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('main', (done) => {
    sequence('clean', 'router', done)
});


gulp.task('rollupTest', () => {
    return gulp.src('./test/**/*.js', {read: false})
        .pipe(rollupStream('/test/'))
        .pipe(gulp.dest('./target'));
});

gulp.task('runTest', () => {
    return gulp.src([
        './target/**/*.js'
    ], {read: false}).pipe(mocha({reporter: 'list'}));

});

gulp.task('test', done => {
    sequence('main', 'rollupTest', 'runTest', done);
});


gulp.task('default', ['main']);

