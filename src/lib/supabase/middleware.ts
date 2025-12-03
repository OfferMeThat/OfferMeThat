import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { hasEnvVars } from "../utils"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // If the env vars are not set, skip middleware check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  // Check if user is authenticated
  const isAuthenticated = !!user

  // Check if the current path is an auth page
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth")

  // Check if the current path is a public username route (e.g., /username)
  // Username routes are public and don't require authentication
  const pathname = request.nextUrl.pathname
  const isPublicUsernameRoute =
    pathname.length > 1 &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/offer-form") &&
    !pathname.startsWith("/settings") &&
    !pathname.startsWith("/verify-offer") &&
    !pathname.startsWith("/listings") &&
    !pathname.startsWith("/offers") &&
    !pathname.startsWith("/leads") &&
    !pathname.startsWith("/messages") &&
    pathname.split("/").length === 2 // Only one segment after root (e.g., /username)

  // Allow public access to username routes
  if (isPublicUsernameRoute) {
    return supabaseResponse
  }

  // Redirect unauthenticated users to /auth (unless they're already on an auth page)
  if (!isAuthenticated && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages to home
  if (isAuthenticated && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
