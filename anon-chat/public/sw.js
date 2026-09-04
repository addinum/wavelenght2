self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const sender = data.senderName || 'New message';
  const body = data.message || 'You received a new message';
  const chatId = data.chatId || '';
  event.waitUntil(self.registration.showNotification(sender, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'wavelength-chat-' + chatId,
    renotify: true,
    data: { chatId }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const chatId = event.notification.data?.chatId || '';
  event.waitUntil((async () => {
    const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of list) {
      if ('focus' in client) {
        try { client.postMessage({ type: 'OPEN_CHAT', chatId }); } catch (_) {}
        return client.focus();
      }
    }
    return clients.openWindow('/');
  })());
});
