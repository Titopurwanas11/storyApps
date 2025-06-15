import { showToast } from "./utils/helpers.js";
import { AuthService } from "./auth.js"; // Pastikan ini diimpor dan mengacu ke file auth.js yang benar

export class AppError extends Error {
  constructor(message, type, metadata = {}) {
    super(message);
    this.name = "AppError";
    this.type = type; // 'AUTH', 'NETWORK', 'VALIDATION', etc.
    this.metadata = metadata; // { statusCode: 401, originalError: ... }
  }
}

export const handleError = (error) => {
  console.error(`[${error.type}]`, error.message, error.metadata);

  switch (error.type) {
    case "AUTH":
      handleAuthError(error);
      break;
    case "NETWORK":
      showToast("Network error. Please check your connection.");
      break;
    case "VALIDATION":
      showValidationErrors(error.metadata.errors);
      break;
    default:
      showToast("An unexpected error occurred");
  }
};

const handleAuthError = (error) => {
  AuthService._clearAuthData(); 

  switch (error.code) {
    case "SESSION_EXPIRED":
      showToast("Session expired. Please login again.");
      location.hash = "#/login";
      break;
    case "UNAUTHENTICATED":
      showToast("Anda harus login untuk melanjutkan."); // Tambahkan pesan lebih spesifik
      location.hash = "#/login";
      break;
    default:
      showToast(`Auth error: ${error.message}`);
  }
};

const showValidationErrors = (errors) => {
  errors.forEach((err) => {
    const field = document.getElementById(err.field);
    if (field) {
      field.classList.add("error");
      // Memastikan elemen pesan error ada dan memiliki kelas yang benar
      const errorMessageElement = field.nextElementSibling;
      if (errorMessageElement && errorMessageElement.classList.contains('error-message')) {
        errorMessageElement.textContent = err.message;
      } else {
            // Jika tidak ada elemen error-message, log ke konsol atau tampilkan toast
            console.warn(`Elemen pesan error untuk bidang '${err.field}' tidak ditemukan di samping input.`);
            showToast(`Validasi: ${err.message}`, 'error');
        }
    }
  });
};