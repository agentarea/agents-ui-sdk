'use client'

import { Geist, Geist_Mono } from "next/font/google";
import '@agentarea/styles/index.css';
import '@agentarea/styles/components.css';
import "./globals.css";
import { AgentProvider } from '@agentarea/react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AgentProvider>
          {children}
        </AgentProvider>
      </body>
    </html>
  );
}
