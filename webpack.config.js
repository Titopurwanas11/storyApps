const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // Pastikan ini diimpor
const { InjectManifest } = require('workbox-webpack-plugin'); // <-- PERBAIKAN: Import InjectManifest

module.exports = {
  mode: 'development',
  entry: {
    app: path.resolve(__dirname, 'src/js/app.js'),
    
  },
  output: {
    filename: 'js/[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/storyApps/', // Pastikan ini sudah sesuai dengan nama repository Anda
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
        { from: path.resolve(__dirname, 'src/offline.html'), to: 'offline.html' },
        { from: path.resolve(__dirname, 'src/js/sw-register.js'), to: 'js/sw-register.js' },

        { from: path.resolve(__dirname, 'src/manifest.json'), to: 'manifest.json' },

        // Pola copy untuk ikon Leaflet Marker
        { from: path.resolve(__dirname, 'src/assets/icons/marker-icon.webp'), to: 'assets/icons/marker-icon.webp' },
        { from: path.resolve(__dirname, 'src/assets/icons/marker-icon-2x.webp'), to: 'assets/icons/marker-icon-2x.webp' },
        { from: path.resolve(__dirname, 'src/assets/icons/marker-shadow.webp'), to: 'assets/icons/marker-shadow.webp' },

        // Pola copy untuk semua ikon PWA
        { from: path.resolve(__dirname, 'src/assets/icons/android-chrome-192x192.png'), to: 'assets/icons/android-chrome-192x192.png' },
        { from: path.resolve(__dirname, 'src/assets/icons/android-chrome-512x512.png'), to: 'assets/icons/android-chrome-512x512.png' },
        { from: path.resolve(__dirname, 'src/assets/icons/apple-touch-icon.png'), to: 'assets/icons/apple-touch-icon.png' },
        { from: path.resolve(__dirname, 'src/assets/icons/favicon-16x16.png'), to: 'assets/icons/favicon-16x16.png' },
        { from: path.resolve(__dirname, 'src/assets/icons/favicon-32x32.png'), to: 'assets/icons/favicon-32x32.png' },
        { from: path.resolve(__dirname, 'src/assets/icons/favicon.ico'), to: 'assets/icons/favicon.ico' },
      ],
    }),

    // --- PERBAIKAN: Tambahkan InjectManifest plugin ---
    new InjectManifest({
      swSrc: path.resolve(__dirname, 'src/sw.js'), // Sumber Service Worker Anda
      swDest: 'sw.js', // Nama file Service Worker output di folder dist/
    }),
    // --- AKHIR PERBAIKAN ---
  ],

  // Konfigurasi devServer (tidak berubah)
  devServer: {
    static: { directory: path.resolve(__dirname, 'dist') },
    compress: true,
    port: 8080,
    historyApiFallback: true,
    open: true,
  },
};