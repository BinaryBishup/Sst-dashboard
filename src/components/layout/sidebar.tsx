"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  Users,
  Truck,
  ChevronDown,
  Pizza,
  Grid3X3,
  Plus,
  X,
  Menu,
  Package2
} from "lucide-react"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Orders", href: "/orders", icon: ShoppingBag },
  {
    name: "Products",
    icon: Package,
    children: [
      { name: "Categories", href: "/products/categories", icon: Grid3X3 },
      { name: "Products", href: "/products", icon: Pizza },
      { name: "Combos", href: "/products/combos", icon: Package2 },
      { name: "Add-ons", href: "/products/addons", icon: Plus },
    ],
  },
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
  const [expandedItems, setExpandedItems] = useState<string[]>(["Products"])

  const toggleExpand = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((item) => item !== itemName)
        : [...prev, itemName]
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
          <h1 className="text-lg font-bold text-white lg:text-xl">Food Delivery Admin</h1>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isExpanded = expandedItems.includes(item.name)
          const hasChildren = item.children && item.children.length > 0
          const isActive = item.href === pathname || 
            (hasChildren && item.children.some(child => child.href === pathname))

          if (hasChildren) {
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleExpand(item.name)}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-md px-2 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>
                {isExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                          pathname === child.href
                            ? "bg-gray-800 text-white"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                        )}
                      >
                        <child.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href!}
              className={cn(
                "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          )
        })}
        </nav>
      </div>
    </>
  )
}