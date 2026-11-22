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
      <style>{"\n        .forced-light-surface,\n        .forced-light-surface * {\n          --background: 0 0% 100% !important;\n          --foreground: 0 0% 0% !important;\n          --card: 0 0% 100% !important;\n          --card-foreground: 0 0% 0% !important;\n          --popover: 0 0% 100% !important;\n          --popover-foreground: 0 0% 0% !important;\n          --muted: 0 0% 96% !important;\n          --muted-foreground: 0 0% 40% !important;\n          --border: 0 0% 80% !important;\n          --input: 0 0% 80% !important;\n        }\n        .forced-light-surface {\n          background-color: #ffffff !important;\n          color: #000000 !important;\n        }\n        .forced-light-surface h1,\n        .forced-light-surface h2,\n        .forced-light-surface h3,\n        .forced-light-surface h4,\n        .forced-light-surface h5,\n        .forced-light-surface h6,\n        .forced-light-surface p,\n        .forced-light-surface span,\n        .forced-light-surface label,\n        .forced-light-surface div {\n          color: inherit;\n        }\n        .forced-light-surface .text-muted-foreground {\n          color: #666666 !important;\n        }\n        .forced-light-surface .bg-card,\n        .forced-light-surface [class*=\"bg-card\"] {\n          background-color: #ffffff !important;\n        }\n        .forced-light-surface .bg-background,\n        .forced-light-surface [class*=\"bg-background\"] {\n          background-color: #ffffff !important;\n        }\n        .forced-light-surface .text-card-foreground,\n        .forced-light-surface .text-foreground,\n        .forced-light-surface [class*=\"text-card-foreground\"],\n        .forced-light-surface [class*=\"text-foreground\"] {\n          color: #000000 !important;\n        }\n        .forced-light-surface .border-border,\n        .forced-light-surface [class*=\"border-border\"] {\n          border-color: #e0e0e0 !important;\n        }\n        .forced-light-surface input,\n        .forced-light-surface textarea,\n        .forced-light-surface select {\n          background-color: #ffffff !important;\n          color: #000000 !important;\n          border-color: #cccccc !important;\n        }\n        .forced-light-surface input::placeholder,\n        .forced-light-surface textarea::placeholder {\n          color: #888888 !important;\n        }\n      "}</style>
      {children}
    </div>
  );
}

export default ForcedLightSurface;
