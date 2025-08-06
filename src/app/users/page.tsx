"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Ban,
  CheckCircle,
  XCircle,
  Users as UsersIcon,
  UserPlus,
  Activity,
  TrendingUp,
  Loader2,
  User,
  Gift,
  Plus,
  Minus
} from "lucide-react"
import { useProfiles } from "@/lib/hooks/useSupabaseData"
import { formatCurrency, profilesService } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Profile = Database['public']['Tables']['profiles']['Row']

const getUserStatus = (profile: Profile) => {
  // Since we don't have a status field, we'll determine status based on activity
  if (!profile.updated_at) return "Inactive"
  
  const lastUpdate = new Date(profile.updated_at)
  const now = new Date()
  const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysSinceUpdate <= 30) return "Active"
  if (daysSinceUpdate <= 90) return "Inactive"
  return "Dormant"
}

const statusStyles = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-yellow-100 text-yellow-800",
  Dormant: "bg-gray-100 text-gray-800",
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Unknown"
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getInitials = (name: string | null) => {
  if (!name) return "U"
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [rewardPoints, setRewardPoints] = useState("")
  const [rewardType, setRewardType] = useState<"add" | "subtract">("add")
  const [isUpdating, setIsUpdating] = useState(false)
  const { profiles, loading, error, refetch } = useProfiles()

  const handleRewardPoints = (profile: Profile, type: "add" | "subtract") => {
    setSelectedProfile(profile)
    setRewardType(type)
    setRewardPoints("")
    setIsRewardModalOpen(true)
  }

  const updateRewardPoints = async () => {
    if (!selectedProfile || !rewardPoints) return

    setIsUpdating(true)
    try {
      const pointsToChange = parseInt(rewardPoints)
      const currentPoints = selectedProfile.loyalty_points || 0
      const newPoints = rewardType === "add" 
        ? currentPoints + pointsToChange 
        : Math.max(0, currentPoints - pointsToChange)

      await profilesService.update(selectedProfile.id, {
        loyalty_points: newPoints
      })

      refetch()
      setIsRewardModalOpen(false)
      setSelectedProfile(null)
      setRewardPoints("")
    } catch (error) {
      console.error('Error updating reward points:', error)
      alert('Error updating reward points')
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = (profile.full_name && profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (profile.email && profile.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (profile.phone && profile.phone.includes(searchQuery))
    
    const status = getUserStatus(profile)
    const matchesStatus = selectedStatus === "All" || status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading users</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const totalUsers = profiles.length
  const activeUsers = profiles.filter(p => getUserStatus(p) === 'Active').length
  const newThisMonth = profiles.filter(p => {
    if (!p.updated_at) return false
    const date = new Date(p.updated_at)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length
  const avgSpent = profiles.reduce((sum, p) => sum + (p.total_spent || 0), 0) / (profiles.length || 1)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Users</h2>
            <p className="text-muted-foreground">
              Manage your customer base
            </p>
          </div>
          <Button disabled>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Users
              </CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Total registered users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                {totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}% of total users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New This Month
              </CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                Updated profiles this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Order Value
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(avgSpent)}</div>
              <p className="text-xs text-muted-foreground">
                Average user spending
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User List</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center space-x-2">
              {["All", "Active", "Inactive", "Dormant"].map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                >
                  {status} {status !== "All" && `(${profiles.filter(p => getUserStatus(p) === status).length})`}
                </Button>
              ))}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Reward Points</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => {
                  const status = getUserStatus(profile)
                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            {profile.avatar_url ? (
                              <img 
                                src={profile.avatar_url} 
                                alt={profile.full_name || "User"}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <div className="text-sm font-medium text-gray-600">
                              {getInitials(profile.full_name)}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{profile.full_name || "Unknown User"}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {profile.id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {profile.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="mr-1 h-3 w-3 text-muted-foreground" />
                              {profile.email}
                            </div>
                          )}
                          {profile.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="mr-1 h-3 w-3" />
                              {profile.phone}
                            </div>
                          )}
                          {!profile.email && !profile.phone && (
                            <div className="text-sm text-gray-400">No contact info</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {profile.total_spent ? formatCurrency(profile.total_spent) : "₹0"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Gift className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{profile.loyalty_points || 0}</span>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRewardPoints(profile, "add")}
                              title="Add reward points"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRewardPoints(profile, "subtract")}
                              title="Subtract reward points"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(profile.updated_at)}</TableCell>
                      <TableCell>
                        {profile.updated_at ? formatDate(profile.updated_at) : "Never"}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
                          {status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" title="View Details">
                            <User className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isRewardModalOpen} onOpenChange={setIsRewardModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {rewardType === "add" ? "Add Reward Points" : "Subtract Reward Points"}
            </DialogTitle>
            <DialogDescription>
              {rewardType === "add" 
                ? `Add reward points to ${selectedProfile?.full_name || "this user"}'s account`
                : `Subtract reward points from ${selectedProfile?.full_name || "this user"}'s account`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Points</label>
              <div className="text-2xl font-bold text-yellow-600">
                {selectedProfile?.loyalty_points || 0}
              </div>
            </div>

            <div>
              <label htmlFor="points" className="block text-sm font-medium mb-2">
                Points to {rewardType === "add" ? "Add" : "Subtract"}
              </label>
              <input
                id="points"
                type="number"
                min="1"
                value={rewardPoints}
                onChange={(e) => setRewardPoints(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter points amount"
              />
            </div>

            {rewardType === "subtract" && selectedProfile && (
              <div className="text-sm text-gray-600">
                Available points: {selectedProfile.loyalty_points || 0}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRewardModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={updateRewardPoints}
              disabled={!rewardPoints || isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                rewardType === "add" ? "Add Points" : "Subtract Points"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}