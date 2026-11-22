import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { uiText, useUiLanguage } from "@/i18n/interfaceText";

export default function NotFound() {
  useUiLanguage();
  return (
    <PageWrapper className="bg-background">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h1 className="text-2xl font-bold text-foreground">{uiText("404 Page Not Found")}</h1>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {uiText("This page doesn’t exist or is no longer available. Return to the login page to continue.")}
            </p>
            <Button asChild className="mt-6 w-full">
              <Link href="/login">
                <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                {uiText("Home")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
