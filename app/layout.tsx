import type { Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import './globals.css'

export const metadata: Metadata = {
  title: 'ScholarSpace',
  description: 'Your academic workspace',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Link href="/" className="flex items-center space-x-2">
                  <BookOpen className="h-8 w-8 text-orange-500" />
                  <span className="text-xl font-bold text-gray-900">ScholarSpace</span>
                </Link>
                
                <div className="hidden md:flex items-center space-x-8">
                  <SignedIn>
                    <Link href="/home" className="text-gray-700 hover:text-orange-500 font-medium">
                      Home
                    </Link>
                    <Link href="/dashboard" className="text-gray-700 hover:text-orange-500 font-medium">
                      Dashboard
                    </Link>
                    <Link href="/students" className="text-gray-700 hover:text-orange-500 font-medium">
                      Students
                    </Link>
                    <Link href="/learning-plans" className="text-gray-700 hover:text-orange-500 font-medium">
                      Learning Plans
                    </Link>
                    <Link href="/curriculum" className="text-gray-700 hover:text-orange-500 font-medium">
                      Curriculum
                    </Link>
                  </SignedIn>
                  <SignedOut>
                    <Link href="#features" className="text-gray-700 hover:text-orange-500 font-medium">
                      Features
                    </Link>
                    <Link href="#pricing" className="text-gray-700 hover:text-orange-500 font-medium">
                      Pricing
                    </Link>
                    <Link href="#about" className="text-gray-700 hover:text-orange-500 font-medium">
                      About
                    </Link>
                  </SignedOut>
                </div>

                <div className="flex items-center gap-4">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button variant="outline" className="mr-2">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        Get Started
                      </Button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                </div>
              </div>
            </div>
          </header>
          <main>{children}</main>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
