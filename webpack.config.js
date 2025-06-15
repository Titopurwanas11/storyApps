const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    app: path.resolve(__dirname, 'src/js/app.js'),
  },
  output: {
    filename: 'js/[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/',
  },
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.(png|svg|jpg|jpeg|gif|webp)$/i, type: 'asset/resource', generator: { filename: 'assets/images/[name][ext]' } },
      { test: /\.(ico|webp)$/i, type: 'asset/resource', generator: { filename: 'assets/icons/[name][ext]' } },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      filename: 'index.html',
      chunks: ['app'],
    }),

    new CopyWebpackPlugin({
      patterns: [
        // Aset utama (Service Worker, Offline HTML)
        { from: path.resolve(__dirname, 'src/sw.js'), to: 'sw.js' },
        { from: path.resolve(__dirname, 'src/offline.html'), to: 'offline.html' },
        // Aturan copy untuk sw-register.js
        { from: path.resolve(__dirname, 'src/js/sw-register.js'), to: 'js/sw-register.js' },

        // --- PERBAIKAN: Tambahkan pola untuk manifest.json dan SEMUA ikon PWA dari manifest Anda ---
        { from: path.resolve(__dirname, 'src/manifest.json'), to: 'manifest.json' }, // Salin manifest.json

        // Pola copy untuk ikon Leaflet Marker (dari assets/icons/)
        { from: path.resolve(__dirname, 'src/assets/icons/marker-icon.webp'), to: 'assets/icons/marker-icon.webp' },
        { from: path.resolve(__dirname, 'src/assets/icons/marker-icon-2x.webp'), to: 'assets/icons/marker-icon-2x.webp' },
        { from: path.resolve(__dirname, 'src/assets/icons/marker-shadow.webp'), to: 'assets/icons/marker-shadow.webp' },

        // Pola copy untuk semua ikon PWA yang tercantum di manifest.json (dari assets/icons/)
        // PASTIKAN NAMA FILE DAN UKURANNYA SESUAI DENGAN YANG ADA DI src/assets/icons/
        { from: path.resolve(__dirname, 'src/assets/icons/android-chrome-192x192.png'), to: 'assets/icons/android-chrome-192x192.png' },
        { from: path.resolve(__dirname, 'src/assets/icons/android-chrome-512x512.png'), to: 'assets/icons/android-chrome-512x512.png' },
        { from: path.resolve(__dirname, 'src/assets/icons/apple-touch-icon.png'), to: 'assets/icons/apple-touch-icon.png' },
        { from: path.resolve(__dirname, 'src/assets/icons/favicon-16x16.png'), to: 'assets/icons/favicon-16x16.png' },
        { from: path.resolve(__dirname, 'src/assets/icons/favicon-32x32.png'), to: 'assets/icons/favicon-32x32.png' },
        // Jika ada favicon.ico di src/assets/icons/ dan ingin di-copy:
        { from: path.resolve(__dirname, 'src/assets/icons/favicon.ico'), to: 'assets/icons/favicon.ico' },
        // ... tambahkan pola untuk ukuran ikon lain jika Anda miliki (misal: icon-72x72.png, icon-96x96.png, icon-128x128.png, icon-144x144.png, icon-152x152.png, icon-384x384.png)
      ],
    }),
  ],
  devServer: {
    static: { directory: path.resolve(__dirname, 'dist') },
    compress: true,
    port: 8080,
    historyApiFallback: true,
    open: true,
  },
};