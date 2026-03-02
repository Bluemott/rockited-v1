"use client";

import {
  FileText,
  HelpCircle,
  BookOpen,
  Headphones,
  RotateCcw,
  Shield,
  FileCheck,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";


const navigationItems = [
  { name: "About", href: "/about", icon: FileText },
  { name: "Customer Service", href: "/about/customer-service", icon: Headphones },
  { name: "Returns", href: "/about/returns", icon: RotateCcw },
  { name: "FAQ", href: "/about/faq", icon: HelpCircle },
  { name: "Privacy Policy", href: "/about/privacy", icon: Shield },
  { name: "Terms of Service", href: "/about/terms", icon: FileCheck },
  { name: "Resources", href: "/resources", icon: BookOpen },
  { name: "Shipping Info", href: "/about/shipping", icon: Truck },
];

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>About</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/about" && pathname?.startsWith(item.href));

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex-1 p-6 md:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
