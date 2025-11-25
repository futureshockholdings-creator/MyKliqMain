import { cn } from "@/lib/utils";

interface ForcedLightSurfaceProps {
  children: React.ReactNode;
  className?: string;
}

export function ForcedLightSurface({ children, className }: ForcedLightSurfaceProps) {
  return (
    <div 
      className={cn(
        "forced-light-surface min-h-screen",
        className
      )}
      style={{
        backgroundColor: '#ffffff',
        color: '#000000',
      }}
    >
      <style>{`
        .forced-light-surface,
        .forced-light-surface * {
          --background: 0 0% 100% !important;
          --foreground: 0 0% 0% !important;
          --card: 0 0% 100% !important;
          --card-foreground: 0 0% 0% !important;
          --popover: 0 0% 100% !important;
          --popover-foreground: 0 0% 0% !important;
          --muted: 0 0% 96% !important;
          --muted-foreground: 0 0% 40% !important;
          --border: 0 0% 80% !important;
          --input: 0 0% 80% !important;
        }
        .forced-light-surface {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        .forced-light-surface h1,
        .forced-light-surface h2,
        .forced-light-surface h3,
        .forced-light-surface h4,
        .forced-light-surface h5,
        .forced-light-surface h6,
        .forced-light-surface p,
        .forced-light-surface span,
        .forced-light-surface label,
        .forced-light-surface div {
          color: inherit;
        }
        .forced-light-surface .text-muted-foreground {
          color: #666666 !important;
        }
        .forced-light-surface .bg-card,
        .forced-light-surface [class*="bg-card"] {
          background-color: #ffffff !important;
        }
        .forced-light-surface .bg-background,
        .forced-light-surface [class*="bg-background"] {
          background-color: #ffffff !important;
        }
        .forced-light-surface .text-card-foreground,
        .forced-light-surface .text-foreground,
        .forced-light-surface [class*="text-card-foreground"],
        .forced-light-surface [class*="text-foreground"] {
          color: #000000 !important;
        }
        .forced-light-surface .border-border,
        .forced-light-surface [class*="border-border"] {
          border-color: #e0e0e0 !important;
        }
        .forced-light-surface input,
        .forced-light-surface textarea,
        .forced-light-surface select {
          background-color: #ffffff !important;
          color: #000000 !important;
          border-color: #cccccc !important;
        }
        .forced-light-surface input::placeholder,
        .forced-light-surface textarea::placeholder {
          color: #888888 !important;
        }
      `}</style>
      {children}
    </div>
  );
}

export default ForcedLightSurface;
