/**
 * Service Worker for FavAI Landing Page
 * 提供离线功能和性能优化
 */

const CACHE_NAME = 'favai-landing-v1.0.0';
const STATIC_CACHE = 'favai-static-v1.0.0';
const DYNAMIC_CACHE = 'favai-dynamic-v1.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/assets/css/main.css',
    '/assets/js/main.js',
    '/manifest.json'
];

// 需要缓存的动态资源模式
const CACHE_PATTERNS = [
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
    /\.(?:woff|woff2|ttf|eot|otf)$/,
    /\.(?:css|js)$/
];

// 安装Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Static assets cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Failed to cache static assets:', error);
            })
    );
});

// 激活Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // 删除旧版本的缓存
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // 只处理同源请求
    if (url.origin !== location.origin) {
        return;
    }
    
    // HTML请求 - 网络优先策略
    if (request.destination === 'document') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => cache.put(request, responseClone));
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then(cachedResponse => {
                            return cachedResponse || caches.match('/index.html');
                        });
                })
        );
        return;
    }
    
    // 静态资源 - 缓存优先策略
    if (isStaticAsset(request.url)) {
        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    return fetch(request)
                        .then(response => {
                            if (response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(STATIC_CACHE)
                                    .then(cache => cache.put(request, responseClone));
                            }
                            return response;
                        });
                })
        );
        return;
    }
    
    // API请求 - 网络优先策略
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.status === 200 && request.method === 'GET') {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => cache.put(request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request);
                })
        );
        return;
    }
    
    // 其他请求 - 网络优先策略
    event.respondWith(
        fetch(request)
            .catch(() => caches.match(request))
    );
});

// 后台同步
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// 推送通知
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || '您有新的通知',
            icon: '/assets/images/icon-192x192.png',
            badge: '/assets/images/badge-72x72.png',
            data: data.data || {},
            actions: [
                {
                    action: 'open',
                    title: '查看',
                    icon: '/assets/images/action-open.png'
                },
                {
                    action: 'close',
                    title: '关闭',
                    icon: '/assets/images/action-close.png'
                }
            ],
            requireInteraction: true,
            renotify: true,
            tag: data.tag || 'default'
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'FavAI', options)
        );
    }
});

// 处理通知点击
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // 关闭通知，不执行其他操作
        return;
    } else {
        // 默认行为：打开应用
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// 处理通知关闭
self.addEventListener('notificationclose', event => {
    console.log('Notification closed:', event.notification.tag);
    
    // 发送关闭事件到分析服务
    self.registration.sync.register('notification-close');
});

// 工具函数
function isStaticAsset(url) {
    return CACHE_PATTERNS.some(pattern => pattern.test(url));
}

async function doBackgroundSync() {
    try {
        // 获取离线期间存储的数据
        const db = await openDB();
        const pendingRequests = await db.getAll('pending-requests');
        
        // 尝试发送离线期间的请求
        for (const request of pendingRequests) {
            try {
                await fetch(request.url, request.options);
                await db.delete('pending-requests', request.id);
            } catch (error) {
                console.log('Failed to sync request:', error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// IndexedDB操作
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('favai-db', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // 创建存储离线请求的对象存储
            if (!db.objectStoreNames.contains('pending-requests')) {
                const store = db.createObjectStore('pending-requests', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                store.createIndex('timestamp', 'timestamp');
            }
            
            // 创建存储分析数据的对象存储
            if (!db.objectStoreNames.contains('analytics')) {
                const store = db.createObjectStore('analytics', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                store.createIndex('event', 'event');
                store.createIndex('timestamp', 'timestamp');
            }
        };
    });
}

// 缓存管理
async function cleanupCaches() {
    const cacheNames = await caches.keys();
    const cachesToDelete = cacheNames.filter(name => 
        !name.includes(STATIC_CACHE) && 
        !name.includes(DYNAMIC_CACHE) &&
        !name.includes(CACHE_NAME)
    );
    
    return Promise.all(
        cachesToDelete.map(name => caches.delete(name))
    );
}

// 定期清理缓存
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CLEANUP_CACHES') {
        event.waitUntil(cleanupCaches());
    }
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// 错误处理
self.addEventListener('error', event => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker loaded:', CACHE_NAME);