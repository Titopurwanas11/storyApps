// src/js/utils/validators.js

export const validateStoryForm = (photo, description) => {
    const errors = [];

    // Validasi deskripsi (tetap wajib)
    if (description.length < 10) {
        errors.push('Deskripsi minimal 10 karakter');
    }

    // --- PERBAIKAN DI SINI: Jadikan validasi foto opsional ---
    if (photo) { // <-- Hanya validasi properti foto jika file 'photo' (blob/file object) ADA
        if (photo.size > 1000000) {
            errors.push('Ukuran foto maksimal 1MB');
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(photo.type)) {
            errors.push('Format foto harus JPEG, PNG, atau WebP');
        }
    }
    // Jika 'photo' adalah null atau undefined (karena tidak ada file yang dipilih),
    // blok ini akan dilewati, dan tidak ada error validasi yang ditambahkan.
    // --- AKHIR PERBAIKAN ---

    return {
        isValid: errors.length === 0,
        errors
    };
};