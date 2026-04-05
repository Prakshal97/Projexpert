import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import "./globals.css"
import { NextAuthProvider } from "@/components/providers/NextAuthProvider"

export const metadata: Metadata = {
  title: "ProjExpert - Virtual Internship Simulator",
  description:
    "Experience real work scenarios in a safe environment. Practice with AI managers, build your portfolio, and prepare for your dream career.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <NextAuthProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </NextAuthProvider>
      </body>
    </html>
  )
}
