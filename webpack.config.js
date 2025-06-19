const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // Pastikan ini diimpor
const { InjectManifest } = require('workbox-webpack-plugin'); // <-- PERBAIKAN: Import InjectManifest

module.exports = {
  mode: 'development',
  entry: {
    app: path.resolve(__dirname, 'src/js/app.js'),
<<<<<<< HEAD
    
=======
    // PERHATIAN: Hapus atau komentari 'sw' entry point jika ada, karena InjectManifest akan menanganinya
    // sw: path.resolve(__dirname, 'src/sw.js'),
>>>>>>> 55d9d96762600f07a765da03efa80212afe0c4bb
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

<<<<<<< HEAD
=======
        // Salin manifest.json karena masih ditautkan di index.html
>>>>>>> 55d9d96762600f07a765da03efa80212afe0c4bb
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
<<<<<<< HEAD
      swSrc: path.resolve(__dirname, 'src/sw.js'), // Sumber Service Worker Anda
      swDest: 'sw.js', // Nama file Service Worker output di folder dist/
=======
      swSrc: path.resolve(__dirname, 'src/sw.js'), 
      swDest: 'sw.js', 
>>>>>>> 55d9d96762600f07a765da03efa80212afe0c4bb
    }),
    // --- AKHIR PERBAIKAN ---
  ],

<<<<<<< HEAD
  // Konfigurasi devServer (tidak berubah)
=======
>>>>>>> 55d9d96762600f07a765da03efa80212afe0c4bb
  devServer: {
    static: { directory: path.resolve(__dirname, 'dist') },
    compress: true,
    port: 8080,
    historyApiFallback: true,
    open: true,
  },
};