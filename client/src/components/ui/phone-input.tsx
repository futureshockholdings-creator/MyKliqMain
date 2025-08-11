import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function PhoneInput({ label, error, className, ...props }: PhoneInputProps) {
  return (
    <div className="space-y-2">
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <Input
        type="tel"
        placeholder="+1 (555) 123-4567"
        className={cn(
          "bg-gray-700 border-gray-600 text-white placeholder-gray-400",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
