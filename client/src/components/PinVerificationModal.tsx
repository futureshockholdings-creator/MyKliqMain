import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, X } from "lucide-react";

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function PinVerificationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title = "Security Verification",
  description = "Please enter your 4-digit PIN to access settings"
}: PinVerificationModalProps) {
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      const response = await fetch("/api/user/verify-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        toast({
          title: "PIN Verified",
          description: "Access granted to settings",
        });
        setPin("");
        onSuccess();
      } else {
        const errorData = await response.json();
        toast({
          title: "PIN Verification Failed",
          description: errorData.message || "Incorrect PIN entered",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Unable to verify PIN. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPin("");
    onClose();
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900" data-testid="modal-pin-verification">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Shield className="w-5 h-5 text-blue-600" />
            {title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={handleClose}
            data-testid="button-close-pin-modal"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="pin" className="text-sm font-medium text-gray-900 dark:text-white">
                Enter PIN
              </label>
              <Input
                id="pin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={handlePinChange}
                placeholder="••••"
                className="text-center text-2xl tracking-widest font-mono"
                autoComplete="off"
                autoFocus
                disabled={isVerifying}
                data-testid="input-pin"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isVerifying}
                className="flex-1"
                data-testid="button-cancel-pin"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={pin.length !== 4 || isVerifying}
                className="flex-1"
                data-testid="button-verify-pin"
              >
                {isVerifying ? "Verifying..." : "Verify PIN"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}