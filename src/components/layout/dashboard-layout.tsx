"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="lg:pl-72">
        <Header />
        <main className="px-4 py-6 lg:px-8 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}