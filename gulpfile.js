const gulp         = require('gulp'),
      git          = require('gulp-git'),
      bump         = require('gulp-bump'),
      filter       = require('gulp-filter'),
      rollup       = require('rollup-stream'),
      source       = require('vinyl-source-stream'),
      del          = require('del'),
      fs           = require('fs'),
      includePaths = require('rollup-plugin-includepaths'),
      forceBinding = require('rollup-plugin-force-binding'),
      path         = require('path'),
      mocha        = require('gulp-mocha'),
      async        = require('rollup-plugin-async'),
      exec         = require('child_process').exec,
      through      = require('through2'),
      tag_version  = require('gulp-tag-version'),
      babili       = require("gulp-babili");

//function for taking streams and returning streams;
let chain = (cb) => {
    return through.obj(function (chunk, enc, next) {
        let push = this.push.bind(this);
        cb(chunk, enc).pipe(through.obj((chunk, enc, done) => {
            push(chunk);
            done();
            next();
        }))
    });
};

let getFiles = (dir, files_) => {
    files_    = files_ || [];
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
    let dir        = srcDir[srcDir.length - 1] === '/' ? srcDir.substring(0, srcDir.length - 1) : srcDir,
        baseDir    = process.cwd() + dir + '/',
        {path}     = chunk,
        moduleName = path.replace(baseDir, ''),
        excluded   = excludePaths.filter(file => file !== path);
    return rollup({
                      input:   path,
                      format:  'cjs',
                      name:    moduleName,
                      plugins: [
                          forceBinding([
                                           './node_modules/functional_tasks/src/functional/core/Task',
                                           'Task'
                                       ]),
                          includePaths({
                                           include:    {
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

let watcher = gulp.task('watch', function () {
    // Callback mode, useful if any plugin in the pipeline depends on the `end`/`flush` event
    return gulp.watch('./src/**/*.js', ['main']);
});

gulp.task('copy', () => {
    return gulp.src(['./config/package.json']).pipe(gulp.dest('./functions'));
});

gulp.task('router', () => {
    return rollup({
                      input:   './src/Router.js',
                      format:  'umd',
                      name:    'Router',
                      plugins: [
                          async()
                      ]
                  }).pipe(source('Router.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('restExample', gulp.series(() => del(['./examples/rest/dist']), () => {
    return rollup({
                      input:   './examples/rest/index.js',
                      format:  'cjs',
                      name:    'Rest',
                      plugins: [
                          async(),
                          forceBinding([
                                           './node_modules/functional_tasks/src/functional/core/Task',
                                           'Task'
                                       ]),
                          includePaths({
                                           include:    {
                                               'functional/core/Task':   './node_modules/functional_tasks/src/functional/core/Task',
                                               'functional/async/Fetch': './node_modules/functional_tasks/src/functional/async/Fetch'
                                           },
                                           extensions: ['.js']
                                       })
                      ]
                  }).pipe(source('rest.js'))
        .pipe(gulp.dest('./examples/rest/dist'));
}));

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

gulp.task('main', gulp.series('clean', 'router', 'compress'));
gulp.task('test', gulp.series('main', 'rollupTest', 'runTest'));

gulp.task('bump:patch', () => inc('patch'));
gulp.task('bump:feature', () => inc('minor'));
gulp.task('bump:release', () => inc('major'));

gulp.task('pushTags', gulp.series('test', 'bump:patch', (cb) => {
    exec('git push --tags', (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
}));

gulp.task('publish', gulp.series('pushTags', (cb) => {
    exec('npm publish ./', (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
}));

gulp.task('default', gulp.series('main'));

