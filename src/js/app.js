// src/js/app.js
import '../css/style.css';
import { AuthPresenter, StoriesPresenter } from './presenter.js';
import { showLogin, showRegister, showStories, showAddStory, updateAppHeaderNav } from './view.js';
import { lazyLoadImages } from './auth/assetOptimizer.js';

const routes = {
    '/login': () => showLogin(),
    '/register': () => showRegister(),
    '/stories': async () => {
        const isAuthenticated = await AuthPresenter.checkAuth();
        if (isAuthenticated) {
            showStories();
        } else {
            showLogin();
        }
        // --- AKHIR PERBAIKAN ---
    },
    '/add-story': async () => {
        // --- PERBAIKAN DI SINI ---
        const isAuthenticated = await AuthPresenter.checkAuth();
        if (isAuthenticated) {
            showAddStory();
        } else {
            // Jika tidak terautentikasi, arahkan ke login dan tampilkan login view
            location.hash = '#/login'; // Arahkan hash dulu jika belum
            showLogin(); // PENTING: Panggil showLogin() langsung di sini
        }
    }
};

async function handleRouting() {
    const path = window.location.hash.substring(1) || '/stories'; 
    const routeHandler = routes[path];

    if (!routeHandler) {
        location.hash = '#/stories';
        return;
    }

    if (document.startViewTransition) {
        document.startViewTransition(async () => {
            await routeHandler();
            updateAppHeaderNav(path);
        });
    } else {
        await routeHandler();
        updateAppHeaderNav(path);
    }
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);