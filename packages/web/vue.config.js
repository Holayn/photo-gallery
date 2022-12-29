module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? process.env.VUE_APP_BASE_URL
    : '/',
  devServer: {
    proxy: 'http://localhost:8000',
  }
}