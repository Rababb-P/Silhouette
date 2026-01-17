"use client"

import Image from "next/image"
import { Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/sihlote.png"
            alt="Silhouette Logo"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <h1 className="font-serif text-2xl tracking-wide text-foreground">
            Silhouette
          </h1>
        </div>

        {/* Center - Tagline */}
        <div className="hidden md:block">
          <p className="text-sm text-muted-foreground tracking-widest uppercase">
            AI-Powered Virtual Try-On
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300"
                >
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="tooltip-content text-foreground"
              >
                <p>Your Profile</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom"
                className="tooltip-content text-foreground"
              >
                <p>Menu</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  )
}
