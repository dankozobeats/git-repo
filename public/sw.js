self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Rappel BadHabit'
  const body = data.body || 'Il est temps de tenir ton habitude.'
  const icon = '/icons/icon-192.png'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      data: data.data || {},
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification?.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
