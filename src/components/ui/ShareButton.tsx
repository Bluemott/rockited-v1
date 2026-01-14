"use client";

import { Share2, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shareOnPlatform, type SharePlatform, type ShareData } from "@/lib/share";
import { toast } from "sonner";

export interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  platforms?: SharePlatform[];
  className?: string;
}

const platformConfig: Record<SharePlatform, { label: string; icon?: React.ReactNode }> = {
  pinterest: { label: "Share on Pinterest" },
  facebook: { label: "Share on Facebook" },
  twitter: { label: "Share on Twitter/X" },
  linkedin: { label: "Share on LinkedIn" },
  whatsapp: { label: "Share on WhatsApp" },
  email: { label: "Share via Email" },
  copy: { label: "Copy Link", icon: <Copy className="h-4 w-4" /> },
};

export default function ShareButton({
  url,
  title,
  description,
  image,
  platforms = ["pinterest", "copy"],
  className = "",
}: ShareButtonProps) {
  const shareData: ShareData = {
    url,
    title,
    description,
    image,
  };

  const handleShare = async (platform: SharePlatform) => {
    try {
      if (platform === "copy") {
        await shareOnPlatform(platform, shareData);
        toast.success("Link copied to clipboard!");
      } else {
        await shareOnPlatform(platform, shareData);
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share. Please try again.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className={`rounded-full bg-card hover:opacity-90 border border-border shadow-sm ${className}`}
          aria-label="Share"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] bg-card">
        {platforms.map((platform) => {
          const config = platformConfig[platform];
          return (
            <DropdownMenuItem
              key={platform}
              onClick={() => handleShare(platform)}
              className="cursor-pointer"
            >
              {config.icon ? (
                <span className="mr-2">{config.icon}</span>
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              <span>{config.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
