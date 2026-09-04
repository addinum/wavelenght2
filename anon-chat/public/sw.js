self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const sender = data.senderName || 'New message';
  const body = data.message || 'You received a new message';
  const chatId = data.chatId || '';
  event.waitUntil(self.registration.showNotification(sender, {
    body,
    icon: '/avatars/boy1.jpg',
    badge: '/avatars/boy1.jpg',
    tag: 'wavelength-' + chatId,
    renotify: true,
    data: { chatId }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const chatId = event.notification.data?.chatId || '';
  event.waitUntil(self.clients.matchAll({type:'window', includeUncontrolled:true}).then(list => {
    for (const client of list) {
      if ('focus' in client) {
        client.postMessage({type:'OPEN_CHAT', chatId});
        return client.focus();
      }
    }
    return self.clients.openWindow(chatId ? '/?chat='+encodeURIComponent(chatId) : '/');
  }));
});
