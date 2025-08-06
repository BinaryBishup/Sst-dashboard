import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DollarSign,
  Users,
  ShoppingBag,
  TrendingUp,
  Package,
  Truck,
  Clock,
  CheckCircle
} from "lucide-react"

const stats = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  {
    title: "Total Orders",
    value: "2,350",
    change: "+12.5%",
    icon: ShoppingBag,
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    title: "Active Users",
    value: "12,234",
    change: "+8.2%",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  {
    title: "Products",
    value: "456",
    change: "+3.1%",
    icon: Package,
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  },
]

const recentOrders = [
  { id: "#12345", customer: "John Doe", amount: "$125.00", status: "Delivered", time: "2 hours ago" },
  { id: "#12346", customer: "Jane Smith", amount: "$87.50", status: "In Transit", time: "3 hours ago" },
  { id: "#12347", customer: "Bob Johnson", amount: "$234.00", status: "Preparing", time: "4 hours ago" },
  { id: "#12348", customer: "Alice Brown", amount: "$56.00", status: "Pending", time: "5 hours ago" },
  { id: "#12349", customer: "Charlie Wilson", amount: "$178.90", status: "Delivered", time: "6 hours ago" },
]

const statusColors = {
  Delivered: "bg-green-100 text-green-800",
  "In Transit": "bg-blue-100 text-blue-800",
  Preparing: "bg-yellow-100 text-yellow-800",
  Pending: "bg-gray-100 text-gray-800",
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your food delivery business.
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm font-medium">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
                        {order.status}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-medium">{order.amount}</p>
                        <p className="text-sm text-muted-foreground">{order.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Order Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                  <span className="text-2xl font-bold">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Preparing</span>
                  </div>
                  <span className="text-2xl font-bold">45</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">In Transit</span>
                  </div>
                  <span className="text-2xl font-bold">67</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Delivered</span>
                  </div>
                  <span className="text-2xl font-bold">234</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}