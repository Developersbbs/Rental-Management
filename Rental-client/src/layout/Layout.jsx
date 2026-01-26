import React, { useState } from "react"
import Sidebar from '@/components/Sidebar';
import { useSelector } from "react-redux"
import { selectUser } from '@/redux/features/auth/loginSlice';
import { Outlet } from "react-router-dom"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Lock } from "lucide-react"
import Navbar from '@/layout/Navbar';

const Layout = () => {
  const user = useSelector(selectUser)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleCloseSidebar = () => {
    setMobileSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-muted/30">
      {/* 🔹 Desktop Sidebar (only for authenticated users) */}
      {user && (
        <div className="hidden md:block">
          <Sidebar onNavigate={handleCloseSidebar} />
        </div>
      )}

      {/* 🔹 Main Section */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-[100] w-full border-b border-border">
          <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
            {/* Mobile Menu Button - only for authenticated users */}
            {user && (
              <div className="flex items-center md:hidden">
                <div className="mr-2">
                  <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-foreground hover:bg-muted"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r border-sidebar-border">
                      <Sidebar onNavigate={handleCloseSidebar} />
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Mobile Logo */}
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1.5 rounded-lg shrink-0 shadow-sm">
                    <Lock className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h1 className="text-base font-bold text-foreground truncate tracking-tight">
                    NK TOOLS
                  </h1>
                </div>
              </div>
            )}

            {/* Navbar */}
            <Navbar />
          </div>
        </header>

        {/* 🔹 Page Content */}
        <main className="flex-1 overflow-auto bg-muted/30 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
