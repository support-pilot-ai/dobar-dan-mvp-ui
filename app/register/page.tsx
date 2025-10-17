"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { registerUser, registerUserDemo } from "@/lib/api"
import { setAuthToken } from "@/lib/auth"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleDemoRegister = async () => {
    setIsLoading(true)
    try {
      const response = await registerUserDemo()
      setAuthToken(response.access_token)
      router.push("/chat")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const formData = { email, password, name: fullName }
      const response = await registerUser(formData)
      setAuthToken(response.access_token)
      router.push("/chat")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-balance">Kreiraj nalog</CardTitle>
          <CardDescription>Unesite svoje informacije da započnete</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">Puno ime</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ime Prezime"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vas@primjer.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Lozinka</Label>
              <Input
                id="password"
                type="password"
                placeholder="Kreirajte lozinku"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-6">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Kreiranje naloga..." : "Registruj se"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Već imate nalog?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Prijavi se
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}