import "./globals.css"

import { NotFoundContent } from "@/components/not-found-content"

export default function NotFound() {
  return (
    <html lang="en" className="dark bg-background">
      <body className="font-sans antialiased">
        <NotFoundContent
          title="Page not found"
          description="This page does not exist, but the player is still ready."
          homeLabel="Open ParrotPlayer"
          aboutLabel="Open About"
          languagesLabel="Available languages"
        />
      </body>
    </html>
  )
}
