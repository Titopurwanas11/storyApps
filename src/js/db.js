// src/js/db.js
import { openDB } from 'idb'; // Import openDB dari library idb

const DB_NAME = 'story-map-db';
const DB_VERSION = 1;
const STORIES_STORE_NAME = 'stories'; // Nama object store untuk cerita

/**
 * Membuka atau meng-upgrade database IndexedDB.
 * @returns {Promise<IDBDatabase>} Instance database.
 */
async function openDb() {
  debugger; // <-- TAMBAHKAN DEBUGGER INI
  console.log('Attempting to open IndexedDB...'); // <-- TAMBAHKAN LOG INI
  if (!('indexedDB' in window)) {
    console.warn('IndexedDB not supported in this browser.');
    return null;
  }
  try { // <-- Pastikan try/catch block ini ada
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`IndexedDB upgrade from version ${oldVersion} to ${newVersion}`);
        if (oldVersion < 1) {
          const storiesStore = db.createObjectStore(STORIES_STORE_NAME, {
            keyPath: 'id', // 'id' sebagai primary key
          });
          storiesStore.createIndex('createdAt', 'createdAt', { unique: false });
          storiesStore.createIndex('name', 'name', { unique: false });
          console.log('Object store "stories" created.'); // <-- TAMBAHKAN LOG INI
        }
      },
      blocked() {
        console.warn('IndexedDB operation blocked. Please close other tabs with this app open.');
      },
      blocking() {
        console.warn('IndexedDB operation blocking. Please close other tabs with this app open.');
      }
    });
    console.log('IndexedDB opened successfully:', db); // <-- TAMBAHKAN LOG INI
    return db;
  } catch (error) {
    console.error('Failed to open IndexedDB:', error); // <-- TAMBAHKAN LOG ERROR INI
    return null;
  }
}

export async function storeStory(story) {
  const db = await openDb();
  if (!db) return;
  const tx = db.transaction(STORIES_STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORIES_STORE_NAME);
  try {
    await store.put(story); // Menggunakan put untuk menyimpan/mengupdate
    await tx.done;
    console.log('Story stored in IndexedDB:', story.id);
  } catch (error) {
    console.error('Failed to store story in IndexedDB:', error);
  }
}

/**
 * Mengambil semua cerita dari IndexedDB.
 * @returns {Promise<Array<Object>>} Array cerita.
 */
export async function getStories() {
  const db = await openDb();
  if (!db) return [];
  const tx = db.transaction(STORIES_STORE_NAME, 'readonly');
  const store = tx.objectStore(STORIES_STORE_NAME);
  try {
    // Ambil semua data dan urutkan berdasarkan createdAt terbaru
    const stories = await store.getAll();
    stories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log('Stories retrieved from IndexedDB:', stories.length);
    return stories;
  } catch (error) {
    console.error('Failed to get stories from IndexedDB:', error);
    return [];
  }
}

/**
 * Menghapus cerita dari IndexedDB berdasarkan ID.
 * @param {string} storyId ID cerita yang akan dihapus.
 */
export async function deleteStoryById(storyId) {
  const db = await openDb();
  if (!db) return;
  const tx = db.transaction(STORIES_STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORIES_STORE_NAME);
  try {
    await store.delete(storyId);
    await tx.done;
    console.log('Story deleted from IndexedDB:', storyId);
  } catch (error) {
    console.error('Failed to delete story from IndexedDB:', error);
  }
}

/**
 * Menghapus semua cerita dari IndexedDB.
 */
export async function clearStories() {
  const db = await openDb();
  if (!db) return;
  const tx = db.transaction(STORIES_STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORIES_STORE_NAME);
  try {
    await store.clear();
    await tx.done;
    console.log('All stories cleared from IndexedDB.');
  } catch (error) {
    console.error('Failed to clear stories from IndexedDB:', error);
  }
}