"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Menu } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "next-themes";

export default function Header() {
  const { itemCount } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which logo to use based on theme
  const isDarkMode = mounted && (theme === "dark" || resolvedTheme === "dark");
  const logoSource = isDarkMode ? "/Rockited_Logo_For_Dark_BKGRND.png" : "/Rock_it_ed_Comp.png";

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: "About", href: "/about" },
    { name: "Resources", href: "/resources" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image
              src={logoSource}
              alt="ROCK IT ED"
              width={200}
              height={56}
              className="h-14 w-auto"
              priority
              quality={100}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Cart, Theme Toggle, and Mobile Menu */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Cart */}
            <Button variant="ghost" size="sm" asChild className="relative">
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-4 mt-6">
                  {navigation.map((item) => (
                    <Button
                      key={item.name}
                      variant="ghost"
                      className="justify-start"
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href={item.href}>{item.name}</Link>
                    </Button>
                  ))}
                  <Separator />
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/cart" onClick={() => setMobileMenuOpen(false)}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Cart {itemCount > 0 && `(${itemCount})`}
                    </Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
