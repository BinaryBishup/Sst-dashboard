"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Loader2, ChefHat, ArrowLeft, ChevronDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const countryCodes = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
]

export default function AuthPage() {
  const router = useRouter()
  const [countryCode, setCountryCode] = useState("+91")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<"phone" | "otp">("phone")

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    // Allow up to 10 digits for Indian numbers, 10 for US, etc.
    const maxLength = countryCode === "+91" ? 10 : 10
    setPhone(value.slice(0, maxLength))
  }

  const formatDisplayPhone = () => {
    if (countryCode === "+91" && phone.length === 10) {
      return `${phone.slice(0, 5)} ${phone.slice(5)}`
    } else if (countryCode === "+1" && phone.length === 10) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`
    }
    return phone
  }

  const sendOTP = async () => {
    try {
      setLoading(true)
      setError("")
      
      const fullPhone = countryCode + phone
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      })

      if (error) throw error
      
      setStep("otp")
    } catch (error: any) {
      setError(error.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async () => {
    try {
      setLoading(true)
      setError("")
      
      const fullPhone = countryCode + phone
      
      const { error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: "sms",
      })

      if (error) throw error
      
      router.push("/")
    } catch (error: any) {
      setError(error.message || "Invalid OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <ChefHat className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">SST Bakery Admin</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              {step === "phone" ? "Enter your phone number to continue" : "Enter the verification code"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === "phone" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[120px] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={countryCode === "+91" ? "98765 43210" : "123 456 7890"}
                      value={formatDisplayPhone()}
                      onChange={handlePhoneChange}
                      className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Enter your {countryCode === "+91" ? "10-digit Indian" : "phone"} number
                </p>
              </div>

              <Button 
                onClick={sendOTP}
                disabled={phone.length !== 10 || loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-700">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 text-center text-lg tracking-widest font-mono"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 text-center">
                  Code sent to {countryCode} {formatDisplayPhone()}
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={verifyOTP}
                  disabled={otp.length !== 6 || loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>

                <Button 
                  onClick={() => {
                    setStep("phone")
                    setOtp("")
                    setError("")
                  }}
                  variant="outline"
                  className="w-full text-gray-600 hover:text-gray-900 border-gray-300"
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Change Phone Number
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}