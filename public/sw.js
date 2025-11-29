self.addEventListener("push", event => {
  const data = event.data?.json() || {};

  const title = data.title || "Rappel BadHabit";
  const body = data.body || "Tu as un rappel à faire.";
  const url = data.url || "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      data: { url }
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

