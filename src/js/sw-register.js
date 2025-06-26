// src/js/sw-register.js
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/storyApps/sw.js', { scope: '/storyApps/' }) 
            .then(registration => {
                console.log('ServiceWorker registered with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}