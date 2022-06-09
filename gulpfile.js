import gulp from 'gulp';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import cssmin from 'gulp-cssmin';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import edit from 'gulp-json-editor';
import del from 'del';

console.log(process);
const paths = {
    docs: {
        images: 'docs/images',
        js: 'docs/js',
        css: 'docs/css'
    },
    images: {
        src: 'src/images/*.png',
        dest: 'dist/images'
    },
    styles: {
        src: 'src/css/*.css',
        dest: 'dist/css'
    },
    scripts: {
        src: 'src/*.js',
        dest: 'dist/js'
    }
};

/*
 * For small tasks you can export arrow functions
 */
export const clean = () => del(['dist']);

/*
 * You can also declare named functions and export them as tasks
 */
export function styles() {
    return gulp.src(paths.styles.src)
        .pipe(cssmin())
        .pipe(rename({
            suffix: '.min'
        }))
        // pass in options to the stream
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(gulp.dest(paths.docs.css));
}

export const copyImages = () => gulp.src(paths.images.src)
    .pipe(gulp.dest(paths.docs.images))
    .pipe(gulp.dest(paths.images.dest));

export function scripts() {
    return gulp.src(paths.scripts.src, {sourcemaps: true})
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(gulp.dest(paths.docs.js));
}

export function copySource() {

    let version;

    gulp.src('./package.json')
        .pipe(edit(function (json) {
            version = json.version;
        }));

    return gulp.src(paths.scripts.src)
        .pipe(replace(/@\w+/g, function (placeHolder) {
            switch (placeHolder) {
                case '@VERSION':
                    placeHolder = version;
                    break;

                case '@YEAR':
                    placeHolder = (new Date()).getFullYear();
                    break;

                case '@DATE':
                    placeHolder = (new Date()).toISOString();
                    break;
            }
            return placeHolder;
        }))
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(gulp.dest(paths.docs.js));
}


const build = gulp.series(clean, gulp.parallel(scripts, styles, copyImages, copySource));
/*
 * Export a default task
 */
export default build;