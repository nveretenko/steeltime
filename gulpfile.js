'use strict'

var gulp = require('gulp'),
  gulpLoadPlugins = require('gulp-load-plugins'),
  $ = gulpLoadPlugins({ pattern: '*' })

var path = {
  build: {
    html: 'build/',
    styles: 'build/',
    js: 'build/',
    fonts: 'build/fonts/',
    images: 'build/images',
  },
  src: {
    html: 'src/*.html',
    styles: 'src/styles/main.scss',
    js: 'src/js/main.js',
    images: 'src/images/**/*.{jpg,png}',
    fonts: 'src/fonts/**/*.*',
    spriteSvg: 'src/images/sprite-svg/*.svg',
  },
  watch: {
    html: 'src/**/*.html',
    js: 'src/js/**/*.js',
    fonts: 'src/fonts/**/*.*',
    styles: 'src/styles/**/*.scss',
    images: 'src/images/**/*.*',
  },
  clean: './build',
}

var configSvg = {
  shape: {
    dimension: {
      // Set maximum dimensions
      maxWidth: 500,
      maxHeight: 500,
    },
    spacing: {
      // Add padding
      padding: 1,
    },
  },
  mode: {
    symbol: {
      dest: '.',
    },
  },
}

var configServe = {
  server: {
    baseDir: './build',
  },
  notify: false,
}

gulp.task('serve', function () {
  $.browserSync.init(configServe)
  $.browserSync.watch('build', $.browserSync.reload)
})

gulp.task('html:build', function () {
  return gulp
    .src(path.src.html)
    .pipe($.rigger())
    .pipe($.webpHtml())
    .pipe(gulp.dest('build'))
})

gulp.task('styles:build', function () {
  return gulp
    .src(path.src.styles)
    .pipe($.if(!$.yargs.argv.production, $.sourcemaps.init()))
    .pipe($.sass())
    .pipe($.webpCss())
    .pipe($.if($.yargs.argv.production, $.cleanCss()))
    .pipe($.if($.yargs.argv.production, $.autoprefixer()))
    .pipe($.rename({ suffix: '.min' }))
    .pipe($.if(!$.yargs.argv.production, $.sourcemaps.write()))
    .pipe(gulp.dest(path.build.styles))
})

gulp.task('js:build', function () {
  return gulp
    .src(path.src.js)
    .pipe($.rigger())
    .pipe($.if($.yargs.argv.production, $.uglify()))
    .pipe($.rename({ suffix: '.min' }))
    .pipe(gulp.dest(path.build.js))
})

gulp.task('images:build', function () {
  return gulp
    .src(path.src.images)
    .pipe(
      $.cache(
        $.imagemin({
          interlaced: true,
          progressive: true,
          optimizationLevel: 5,
        })
      )
    )
    .pipe(gulp.dest(path.build.images))
    .pipe($.webp({ quality: 75 }))
    .pipe($.extReplace('.webp'))
    .pipe(gulp.dest(path.build.images))
})

gulp.task('svgSprite:build', function () {
  return gulp
    .src(path.src.spriteSvg)
    .pipe(
      $.cache(
        $.imagemin({
          interlaced: true,
          progressive: true,
          optimizationLevel: 5,
          svgoPlugins: [
            {
              removeViewBox: true,
            },
          ],
        })
      )
    )
    .pipe(
      $.cheerio({
        run: function ($) {
          $('[fill^="#"]').removeAttr('fill')
          $('[style]').removeAttr('style')
        },
        parserOptions: { xmlMode: true },
      })
    )
    .pipe($.svgSprite(configSvg))
    .pipe(gulp.dest(path.build.images))
})

gulp.task('fonts:build', function () {
  return gulp.src(path.src.fonts).pipe(gulp.dest(path.build.fonts))
})

gulp.task(
  'build',
  gulp.parallel(
    'html:build',
    'fonts:build',
    'styles:build',
    'js:build',
    'images:build',
    'svgSprite:build'
  )
)

gulp.task('watch', function () {
  gulp.watch(path.watch.html, gulp.series('html:build'))
  gulp.watch(path.watch.styles, gulp.series('styles:build'))
  gulp.watch(path.watch.images, gulp.series('images:build'))
  gulp.watch(path.watch.images, gulp.series('svgSprite:build'))
  gulp.watch(path.watch.fonts, gulp.series('fonts:build'))
  gulp.watch(path.watch.js, gulp.series('js:build'))
})

gulp.task('clean', function () {
  return $.del(path.clean, { read: false })
})

gulp.task('clear', function () {
  return $.cache.clearAll()
})

gulp.task(
  'default',
  gulp.series('clean', 'build', gulp.parallel('watch', 'serve'))
)

/*gulp                (command for development)*/
/*gulp  --production  (command for production)*/
