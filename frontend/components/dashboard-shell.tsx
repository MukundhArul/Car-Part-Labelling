import type React from "react"
interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        <div className="container grid items-start gap-8 py-8">{children}</div>
      </main>
    </div>
  )
}

