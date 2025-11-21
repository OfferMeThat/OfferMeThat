"use client"

import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

const LoginForm = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // First check if user exists
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (signInError) {
        // Check if it's an invalid credentials error
        if (
          signInError.message.includes("Invalid login credentials") ||
          signInError.message.includes("Email not confirmed")
        ) {
          // Try to check if user exists by attempting to sign up with same email
          const { error: checkError } = await supabase.auth.signUp({
            email,
            password: "dummy-check-password",
          })

          // If we get "User already registered" error, the user exists but password is wrong
          if (checkError?.message.includes("User already registered")) {
            setError("Invalid password. Please try again.")
          } else {
            // User doesn't exist
            setError("No account found with this email. Please sign up first.")
          }
        } else {
          setError(signInError.message)
        }
        return
      }

      // Successful login
      router.push("/")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email address</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="Enter your email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <div className="mb-2 flex items-baseline justify-between">
          <Label htmlFor="login-password">Password</Label>
          {/* <Link
            href="/auth/forgot-password"
            className="text-muted-foreground text-xs leading-0 hover:underline"
          >
            Forgot password?
          </Link> */}
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Log In"}
      </Button>
    </form>
  )
}

export default LoginForm
