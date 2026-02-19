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
import { registerUser } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const cleanPhone = phoneNumber.replace(/\s/g, "")
      const formData = { email, password, name: fullName, phone_number: `387${cleanPhone}` }
      await registerUser(formData)
      setIsSuccess(true)
      toast({
        title: "Nalog kreiran!",
        description: `Poslali smo ti email na ${email}. Provjeri email i potvrdi nalog da bi se prijavio. (Nemoj zaboraviti pogledati i spam!)`,
        duration: 10000,
        variant: "success",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-balance text-center">Nalog kreiran!</CardTitle>
            <CardDescription className="text-center">
              Poslali smo ti email na <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-center">
                Provjeri email i potvrdi nalog da bi se prijavio.
                <br />
                <span className="text-sm text-muted-foreground">(Nemoj zaboraviti pogledati i spam!)</span>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button onClick={() => router.push("/login")} className="w-full">
              Idi na prijavu
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
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
              <Label htmlFor="phone">Broj telefona</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  +387
                </span>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="61 234 567"
                  value={phoneNumber}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9]/g, "")
                    if (value.length > 9) value = value.slice(0, 9)
                    
                    if (value.length <= 2) {
                      setPhoneNumber(value)
                    } else if (value.length <= 5) {
                      setPhoneNumber(`${value.slice(0, 2)} ${value.slice(2)}`)
                    } else {
                      setPhoneNumber(`${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5)}`)
                    }
                  }}
                  required
                  disabled={isLoading}
                  className="rounded-l-none"
                  maxLength={11}
                />
              </div>
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
