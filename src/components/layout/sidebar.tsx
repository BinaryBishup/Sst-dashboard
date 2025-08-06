"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ShoppingBag,
  Pizza,
  Grid3X3,
  Tag,
  Users,
  Truck,
  X,
  Menu,
  Calculator,
  User,
  LogOut
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"

const navigation = [
  { name: "POS", href: "/pos", icon: Calculator },
  { name: "Orders", href: "/orders", icon: ShoppingBag },
  { name: "Products", href: "/products", icon: Pizza },
  { name: "Categories", href: "/products/categories", icon: Grid3X3 },
  { name: "Coupons", href: "/coupons", icon: Tag },
  { name: "Users", href: "/users", icon: Users },
  { name: "Delivery Staff", href: "/delivery-man", icon: Truck },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  // Temporarily disabled until Supabase is configured
  // const { systemUser, signOut } = useAuth()
  const systemUser: { full_name?: string } | null = null as { full_name?: string } | null
  const signOut = () => {}

  return (
    <>
      {/* Mobile Bottom Navigation - Hidden on desktop */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center py-2 px-1 min-w-0 flex-1",
                  isActive
                    ? "text-blue-600"
                    : "text-gray-500"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 mb-1",
                  isActive ? "text-blue-600" : "text-gray-400"
                )} />
                <span className={cn(
                  "text-xs font-medium truncate",
                  isActive ? "text-blue-600" : "text-gray-500"
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-gray-900 overflow-y-auto">
          <div className="flex items-center h-16 px-6 border-b border-gray-800">
            <h1 className="text-xl font-bold text-white">SST Bakery Admin</h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-4 py-4 text-base font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-gray-800 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md"
                  )}
                >
                  <item.icon className={cn(
                    "mr-4 h-6 w-6 flex-shrink-0 transition-colors",
                    isActive ? "text-blue-400" : "text-gray-400 group-hover:text-white"
                  )} />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </nav>
          
          {/* User Profile Section */}
          <div className="px-4 pb-4 border-t border-gray-800">
            <div className="pt-4 space-y-2">
              <Link
                href="/profile"
                className={cn(
                  "group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                  pathname === "/profile"
                    ? "bg-gray-800 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md"
                )}
              >
                <User className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  pathname === "/profile" ? "text-blue-400" : "text-gray-400 group-hover:text-white"
                )} />
                <div className="flex flex-col">
                  <span className="text-sm">Profile</span>
                  {systemUser?.full_name && (
                    <span className="text-xs text-gray-500 group-hover:text-gray-400">
                      {systemUser.full_name}
                    </span>
                  )}
                </div>
              </Link>
              
              <button
                onClick={signOut}
                className="group flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-gray-300 hover:bg-red-900 hover:text-white hover:shadow-md"
              >
                <LogOut className="mr-3 h-5 w-5 flex-shrink-0 transition-colors text-gray-400 group-hover:text-white" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}