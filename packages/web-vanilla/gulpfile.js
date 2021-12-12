const { dest, src, series, watch } = require('gulp');
const babel = require('gulp-babel');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');

const build = () => {
  return (
    src('./src/**/*.js')
      .pipe(plumber())
      .pipe(sourcemaps.init())
      .pipe(
        babel({
          presets: [
            ['@babel/preset-env'],
          ],
        })
      )
      .pipe(concat('main.js'))
      .pipe(sourcemaps.write('.'))
      .pipe(dest('./dist'))
  )
}

const deployDist = () => {
  return src('./dist/**')
    .pipe(plumber())
    .pipe(dest('C:/Users/Kai/Documents/workspace/web-server/static/photos/dist'));
}
const deployRoot = () => {
  return src('./index.html')
    .pipe(plumber())
    .pipe(dest('C:/Users/Kai/Documents/workspace/web-server/static/photos'));
}
const deploy = series(deployDist, deployRoot);

const dev = () => {
  watch('./src/**/*.js', { ignoreInitial: false }, series(build, deploy));
}

exports.build = build;
exports.deploy = deploy;
exports.dev = dev;