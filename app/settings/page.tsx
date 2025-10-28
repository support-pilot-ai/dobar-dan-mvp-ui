"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, User, Shield } from "lucide-react"
import { isAuthenticated, getAuthToken } from "@/lib/auth"
import { getUserProfile, updateUserProfile, changePassword } from "@/lib/api"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    const loadProfile = async () => {
      try {
        const token = getAuthToken()
        if (token) {
          const profile = await getUserProfile(token)
          setName(profile.name || "")
          setEmail(profile.email || "")
        }
      } catch (error) {
        console.error("Failed to load profile:", error)
        toast({
          title: "Greška",
          description: "Greška pri učitavanju profila",
          variant: "destructive",
        })
      }
    }

    loadProfile()
  }, [router, toast])

  const handleSaveProfile = async () => {
    setIsLoading(true)

    try {
      const token = getAuthToken()
      if (!token) {
        router.push("/login")
        return
      }

      await updateUserProfile(token, { name })
      toast({
        title: "Uspjeh",
        description: "Profil uspješno ažuriran",
        variant: "success"
      })
    } catch (error) {
      toast({
        title: "Greška",
        description: "Greška pri ažuriranju profila",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Greška",
        description: "Lozinke se ne podudaraju",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const token = getAuthToken()
      if (!token) {
        router.push("/login")
        return
      }

      await changePassword(token, newPassword)
      toast({
        title: "Uspjeh",
        description: "Lozinka uspješno promijenjena",
        variant: "success"
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast({
        title: "Greška",
        description: "Greška pri promjeni lozinke",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/chat")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Postavke</h1>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Sigurnost
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informacije o profilu</CardTitle>
                <CardDescription>Ažurirajte svoje lične podatke</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Puno ime</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Unesite vaše puno ime"
                  />
                </div>
                <Separator />
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? "Čuvanje..." : "Sačuvaj promjene"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Promjena lozinke</CardTitle>
                <CardDescription>Ažurirajte svoju lozinku da bi vaš nalog bio siguran</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Trenutna lozinka</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Unesite trenutnu lozinku"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova lozinka</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Unesite novu lozinku"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Potvrdite novu lozinku</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Potvrdite novu lozinku"
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={isLoading}>
                  {isLoading ? "Ažuriranje..." : "Ažuriraj lozinku"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}