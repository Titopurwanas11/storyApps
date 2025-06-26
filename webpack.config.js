const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // Import ini jika Anda ingin menggunakannya
const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = {
  // --- PERBAIKAN 1: Mode untuk deployment ---
  // Gunakan 'production' untuk build yang di-deploy ke GitHub Pages.
  // Ini akan mengaktifkan optimisasi seperti minifikasi secara otomatis.
  mode: 'production', // Ubah dari 'development'

  entry: {
    app: path.resolve(__dirname, 'src/js/app.js'),
  },
  output: {
    // --- PERBAIKAN 2: Nama file bundle utama ---
    // Ubah agar app.bundle.js langsung berada di root folder 'dist'.
    // Ini menyelesaikan masalah 404 karena URL yang dicari browser tidak menyertakan 'js/'.
    filename: '[name].bundle.js', // Output akan menjadi dist/app.bundle.js, bukan dist/js/app.bundle.js

    path: path.resolve(__dirname, 'dist'), // Folder output lokal Anda
    clean: true, // Membersihkan folder output sebelum setiap build (ini sudah baik)

    // --- PERBAIKAN 3: publicPath untuk GitHub Pages ---
    // Ini memberitahu Webpack bahwa semua aset harus diakses dengan awalan '/storyApps/'.
    // Ini sudah benar, pastikan nama repository Anda persis 'storyApps'.
    publicPath: '/storyApps/',
  },
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      // Aturan untuk gambar dan ikon ini baik, mereka akan disimpan di 'dist/assets/images/' atau 'dist/assets/icons/'
      { test: /\.(png|svg|jpg|jpeg|gif|webp)$/i, type: 'asset/resource', generator: { filename: 'assets/images/[name][ext]' } },
      { test: /\.(ico|webp)$/i, type: 'asset/resource', generator: { filename: 'assets/icons/[name][ext]' } },
    ],
  },
  plugins: [
    // CleanWebpackPlugin biasanya sudah tidak perlu jika 'output.clean: true' digunakan.
    // Jika Anda tetap ingin menggunakannya, pastikan untuk mengaktifkannya jika diperlukan.
    // new CleanWebpackPlugin(),

    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      filename: 'index.html', // Akan menghasilkan index.html di folder 'dist'
      chunks: ['app'], // Memastikan hanya 'app.bundle.js' yang diinjeksikan
    }),

    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'src/offline.html'), to: 'offline.html' },
        // --- PERBAIKAN 4: Tinjau my-sw-register.js ---
        // Jika Anda sudah mendaftarkan service worker melalui app.js (menggunakan initializeServiceWorker),
        // maka file 'my-sw-register.js' ini bisa redundant atau menyebabkan konflik.
        // Jika tidak lagi digunakan, Anda bisa menghapus baris ini.
        // Jika masih perlu dikopi tapi tidak dieksekusi secara otomatis oleh index.html, bisa saja.
        { from: path.resolve(__dirname, 'src/js/my-sw-register.js'), to: 'js/my-sw-register.js' },

        { from: path.resolve(__dirname, 'src/manifest.json'), to: 'manifest.json' },

        // Pola copy untuk aset lainnya, ini sudah baik karena menargetkan folder 'dist'
        { from: path.resolve(__dirname, 'src/assets/icons/marker-icon.webp'), to: 'assets/icons/marker-icon.webp' },
        { from: path.resolve(__dirname, 'src/assets/icons/marker-icon-2x.webp'), to: 'assets/icons/marker-icon-2x.webp' },
        { from: path.resolve(__dirname, 'src/assets/icons/marker-shadow.webp'), to: 'assets/icons/marker-shadow.webp' },
        { from: path.resolve(__dirname, 'src/assets/images/placeholder.webp'), to: 'assets/images/placeholder.webp' },

        { from: path.resolve(__dirname, 'src/assets/icons/android-chrome-192x192.png'), to: 'assets/icons/android-chrome-192x192.png' },
        { from: path.resolve(__dirname, 'src/assets/icons/android-chrome-512x512.png'), to: 'assets/icons/android-chrome-512x512.png' },
        { from: path.resolve(__dirname, 'src/assets/icons/apple-touch-icon.png'), to: 'assets/icons/apple-touch-icon.png' },
        { from: path.resolve(__dirname, 'src/assets/icons/favicon-16x16.png'), to: 'assets/icons/favicon-16x16.png' },
        { from: path.resolve(__dirname, 'src/assets/icons/favicon-32x32.png'), to: 'assets/icons/favicon-32x32.png' },
        { from: path.resolve(__dirname, 'src/assets/icons/favicon.ico'), to: 'assets/icons/favicon.ico' },
      ],
    }),

    // InjectManifest plugin untuk Service Worker
    new InjectManifest({
      swSrc: path.resolve(__dirname, 'src/sw.js'), // Sumber service worker Anda
      swDest: 'sw.js', // Menghasilkan sw.js langsung di folder 'dist'
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