import { ThemeSwitcher } from "@/components/theme-switcher"
import { ConnectSupabaseSteps } from "@/components/tutorial/connect-supabase-steps"
import { hasEnvVars } from "@/lib/utils"
import { SignUpUserSteps } from "../components/tutorial/sign-up-user-steps"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center gap-20">
        <div className="flex max-w-5xl flex-1 flex-col gap-20 p-5">
          <main className="flex flex-1 flex-col gap-6 px-4">
            <h2 className="mb-4 text-xl font-medium">Next steps</h2>
            {hasEnvVars ? <SignUpUserSteps /> : <ConnectSupabaseSteps />}
          </main>
        </div>

        <footer className="mx-auto flex w-full items-center justify-center gap-8 border-t py-16 text-center text-xs">
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  )
}
