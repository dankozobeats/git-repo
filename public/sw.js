self.addEventListener('push', function (event: any) {
    const data = event.data?.json() ?? {};
    const title = data.title || 'Rappel';
    const options = {
        body: data.body || 'Vous avez un nouveau rappel',
        icon: '/icon.png',
        badge: '/badge.png',
    };

    event.waitUntil(
        (self as any).registration.showNotification(title, options)
    );
});
