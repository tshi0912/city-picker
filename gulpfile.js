import gulp from 'gulp';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import cssmin from 'gulp-cssmin';
import rename from 'gulp-rename';
import del from 'del';

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
        .pipe(babel())
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(gulp.dest(paths.docs.js));
}


const build = gulp.series(clean, gulp.parallel(scripts, styles, copyImages));
/*
 * Export a default task
 */
export default build;