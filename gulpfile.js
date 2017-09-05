const gulp = require('gulp'),
    git = require('gulp-git'),
    bump = require('gulp-bump'),
    filter = require('gulp-filter'),
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
    tag_version = require('gulp-tag-version'),
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
        plugins:    [
            forceBinding([
                './node_modules/functional_tasks/src/functional/core/Task',
                'Task'
            ]),
            includePaths({
                include:    {
                    // Import example: import angular from 'angular';
                    'functional/core/Task':   './node_modules/functional_tasks/src/functional/core/Task',
                    'functional/async/Fetch': './node_modules/functional_tasks/src/functional/async/Fetch'
                },
                extensions: ['.js']
            })
        ],
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
        format:     'umd',
        moduleName: 'Router',
        plugins:    [
            async()
        ]
    }).pipe(source('Router.js'))
        .pipe(gulp.dest('./dist'));
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


let inc = (importance) => gulp.src(['./package.json'])
// bump the version number in those files
    .pipe(bump({type: importance}))
    // save it back to filesystem
    .pipe(gulp.dest('./'))
    // commit the changed version number
    .pipe(git.commit('bumps package version'))

    // read only one file to get the version number
    .pipe(filter('package.json'))
    // **tag it in the repository**
    .pipe(tag_version());

gulp.task('pushTags', ['test', 'bump:patch'], (cb) => {
    exec('git push --tags', (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('compress', () => gulp.src('./dist/**/*.js')
    .pipe(babili({
        mangle: {
            keepClassNames: true
        }
    }))
    .pipe(gulp.dest("./target")));

gulp.task('compressRequire', () => gulp.src('./node_modules/requirejs/require.js')
    .pipe(babili({
        mangle: {
            keepClassNames: true
        }
    }))
    .pipe(gulp.dest("./target")));

gulp.task('publish', ['pushTags'], (cb) => {
    exec('npm publish ./', (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('bump:patch', () => inc('patch'));
gulp.task('bump:feature', () => inc('minor'));
gulp.task('bump:release', () => inc('major'));

gulp.task('main', (done) => {
    sequence('clean', 'router', 'compress', done)
});
gulp.task('test', done => {
    sequence('main', 'rollupTest', 'runTest', done);
});

gulp.task('default', ['main']);

