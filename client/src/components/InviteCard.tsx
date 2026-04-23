import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getInviteMessage, getAppStoreUrl, getDownloadText } from "@/lib/deviceDetection";

interface InviteCardProps {
  firstName: string;
  inviteCode: string;
  kliqClosed?: boolean;
  showNote?: boolean;
}

export function InviteCard({ firstName, inviteCode, kliqClosed, showNote = true }: InviteCardProps) {
  const { toast } = useToast();

  const copyInviteMessage = async () => {
    try {
      const fullMessage = getInviteMessage(firstName, inviteCode);
      await navigator.clipboard.writeText(fullMessage);
      toast({
        title: "Copied!",
        description: "Full invite message copied to clipboard",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy invite message",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-muted rounded p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm text-muted-foreground font-medium flex-1" data-testid="text-invite-message">
            {firstName} wants you to join their Kliq. Use the following Invite Code {inviteCode} and{" "}
            <a
              href={getAppStoreUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 underline"
            >
              {getDownloadText()}
            </a>{" "}
            - "A Different Social Experience"
          </div>
          <Button
            size="sm"
            onClick={copyInviteMessage}
            className="shrink-0 border-2 border-black text-black font-bold"
            style={{ backgroundColor: '#00c853', color: '#000000' }}
            data-testid="button-copy-invite"
          >
            <Copy className="w-4 h-4 text-black" />
          </Button>
        </div>
      </div>
      {showNote && (
        <p className="text-xs text-card-foreground">
          {kliqClosed
            ? "Your kliq is closed to new members. Existing friends can still use your code but new people cannot join."
            : "Copy and paste this complete message to invite friends to your kliq"}
        </p>
      )}
    </div>
  );
}
