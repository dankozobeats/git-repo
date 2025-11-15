import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'BadHabit Tracker 🔥',
  description: 'Track tes mauvaises (et bonnes) habitudes avec un peu de sarcasme.',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔥</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}