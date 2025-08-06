"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Clock,
  Save,
  Upload,
  Camera,
  Loader2,
  Check,
  AlertCircle,
  LogOut
} from "lucide-react"
import { useAuthState } from "@/hooks/useAuth"
import { uploadImage } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"

type SystemUser = Database['public']['Tables']['system_users']['Row']

const roleColors = {
  admin: "bg-red-100 text-red-800 border-red-200",
  manager: "bg-blue-100 text-blue-800 border-blue-200",
  staff: "bg-green-100 text-green-800 border-green-200"
}

const roleLabels = {
  admin: "Administrator",
  manager: "Manager",
  staff: "Staff Member"
}

export default function ProfilePage() {
  const { user, systemUser, loading, updateProfile, signOut, refreshProfile } = useAuthState()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'staff' as 'admin' | 'manager' | 'staff',
    avatar_url: ''
  })

  useEffect(() => {
    if (systemUser) {
      setFormData({
        full_name: systemUser.full_name || '',
        email: systemUser.email || '',
        phone: systemUser.phone || '',
        role: systemUser.role as 'admin' | 'manager' | 'staff',
        avatar_url: systemUser.avatar_url || ''
      })
    }
  }, [systemUser])

  const handleSave = async () => {
    if (!systemUser) return

    setSaving(true)
    setMessage(null)

    try {
      await updateProfile({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        avatar_url: formData.avatar_url
      })
      
      setEditing(false)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' })
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    setUploadingAvatar(true)
    setMessage(null)

    try {
      const avatarUrl = await uploadImage(file, 'avatars')
      
      if (avatarUrl) {
        setFormData(prev => ({ ...prev, avatar_url: avatarUrl }))
        
        // Auto-save avatar
        await updateProfile({ avatar_url: avatarUrl })
        setMessage({ type: 'success', text: 'Avatar updated successfully!' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload avatar' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading || !user || !systemUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading profile...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600">Manage your account information and settings</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-center gap-2 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <Check className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  {!editing ? (
                    <Button onClick={() => setEditing(true)} variant="outline">
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          setEditing(false)
                          setFormData({
                            full_name: systemUser.full_name || '',
                            email: systemUser.email || '',
                            phone: systemUser.phone || '',
                            role: systemUser.role as 'admin' | 'manager' | 'staff',
                            avatar_url: systemUser.avatar_url || ''
                          })
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={saving} size="sm">
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {formData.avatar_url ? (
                        <img 
                          src={formData.avatar_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    
                    {editing && (
                      <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 cursor-pointer">
                        {uploadingAvatar ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Camera className="h-3 w-3" />
                        )}
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploadingAvatar}
                        />
                      </label>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">{formData.full_name}</h3>
                    <Badge className={roleColors[formData.role]} variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      {roleLabels[formData.role]}
                    </Badge>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="pl-10"
                        disabled={!editing}
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                        disabled={!editing}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="pl-10"
                        disabled={!editing}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
                      <Select 
                        value={formData.role} 
                        disabled={true} // Role should only be changed by admins
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="staff">Staff Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-gray-500">Role can only be changed by administrators</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className={systemUser.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {systemUser.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium">
                    {new Date(systemUser.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {systemUser.last_login && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Login</span>
                    <span className="text-sm font-medium">
                      {formatDate(systemUser.last_login)}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profile Updated</span>
                  <span className="text-sm font-medium">
                    {formatDate(systemUser.updated_at)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => refreshProfile()} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <User className="h-4 w-4 mr-2" />
                  Refresh Profile
                </Button>
                
                <Button 
                  onClick={handleSignOut} 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}