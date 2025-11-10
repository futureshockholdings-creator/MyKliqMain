import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface BorderedAvatarProps {
  src: string | undefined;
  alt?: string;
  fallback: string;
  className?: string;
  borderImageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

export function BorderedAvatar({
  src,
  alt,
  fallback,
  className,
  borderImageUrl,
  size = "md",
}: BorderedAvatarProps) {
  const sizeClass = sizeClasses[size];

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClass, "border-2 border-primary", className)}>
        <AvatarImage src={src} alt={alt} className="object-cover" />
        <AvatarFallback className="bg-muted text-foreground">
          {fallback}
        </AvatarFallback>
      </Avatar>
      
      {borderImageUrl && (
        <div
          className={cn(
            "absolute inset-0 pointer-events-none rounded-full",
            sizeClass
          )}
          style={{
            backgroundImage: `url(${borderImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
