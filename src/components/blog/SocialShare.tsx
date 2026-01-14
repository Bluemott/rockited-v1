import ShareButton from "@/components/ui/ShareButton";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

export function SocialShare({ url, title, description, image }: SocialShareProps) {
  return (
    <div className="flex items-center gap-4 pt-6 border-t">
      <span className="text-sm font-medium text-muted-foreground">Share:</span>
      <ShareButton
        url={url}
        title={title}
        description={description}
        image={image}
        platforms={["facebook", "twitter", "linkedin", "copy"]}
      />
    </div>
  );
}
