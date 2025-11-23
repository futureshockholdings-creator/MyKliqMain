import React from "react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  backgroundImageUrl?: string;
  phoneNumber?: string;
  bio?: string;
  inviteCode?: string;
  kliqName?: string;
  isAdmin?: boolean;
  analyticsConsent?: boolean;
  termsAcceptedAt?: string;
  equippedBorderId?: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
