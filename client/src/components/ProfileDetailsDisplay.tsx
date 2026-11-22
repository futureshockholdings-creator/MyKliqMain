import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MapPin, Utensils, Music, Users, BookOpen, Film, Gamepad2, PawPrint } from "lucide-react";
import { usePostTranslation } from "@/lib/translationService";
import { uiText, useUiLanguage } from "@/i18n/interfaceText";

interface ProfileDetailsDisplayProps {
  user: any;
}

export function ProfileDetailsDisplay({ user }: ProfileDetailsDisplayProps) {
  useUiLanguage();
  const { translatePost } = usePostTranslation();
  if (!user) return null;

  const hasAnyDetails = 
    user.interests?.length > 0 ||
    user.favoriteLocations?.length > 0 ||
    user.favoriteFoods?.length > 0 ||
    user.musicGenres?.length > 0 ||
    user.hobbies?.length > 0 ||
    user.favoriteMovies?.length > 0 ||
    user.favoriteBooks?.length > 0 ||
    user.relationshipStatus ||
    user.petPreferences ||
    user.lifestyle;

  if (!hasAnyDetails) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">{uiText("No profile details added yet")}</p>
        </CardContent>
      </Card>
    );
  }

  const DetailSection = ({ 
    title, 
    items, 
    icon: Icon, 
    singleValue 
  }: { 
    title: string; 
    items?: string[]; 
    icon: any; 
    singleValue?: string;
  }) => {
    if (singleValue) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Icon className="w-4 h-4" />
            {title}
          </div>
          <div className="text-foreground">{singleValue}</div>
        </div>
      );
    }

    if (!items || items.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary font-medium">
          <Icon className="w-4 h-4" />
          {title}
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              {translatePost(item)}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  const formatRelationshipStatus = (status: string) => {
    switch (status) {
      case "single": return uiText("Single");
      case "taken": return uiText("In a relationship");
      case "married": return uiText("Married");
      case "complicated": return uiText("It's complicated");
      case "prefer-not-to-say": return uiText("Prefer not to say");
      default: return status;
    }
  };

  const formatPetPreferences = (pref: string) => {
    switch (pref) {
      case "dogs": return uiText("Dog lover");
      case "cats": return uiText("Cat lover");
      case "both": return uiText("Loves dogs & cats");
      case "other": return uiText("Other pets");
      case "none": return uiText("No pets");
      default: return pref;
    }
  };

  const formatLifestyle = (lifestyle: string) => uiText(lifestyle.charAt(0).toUpperCase() + lifestyle.slice(1));

  return (
    <div className="space-y-4">
      {/* Interests & Hobbies */}
      {(user.interests?.length > 0 || user.hobbies?.length > 0) && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Heart className="w-5 h-5" />
              {uiText("Interests & Hobbies")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailSection title={uiText("Interests")} items={user.interests} icon={Heart} />
            <DetailSection title={uiText("Hobbies")} items={user.hobbies} icon={Gamepad2} />
          </CardContent>
        </Card>
      )}

      {/* Favorites */}
      {(user.favoriteLocations?.length > 0 || user.favoriteFoods?.length > 0 || user.musicGenres?.length > 0) && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {uiText("Favorites")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailSection title={uiText("Places")} items={user.favoriteLocations} icon={MapPin} />
            <DetailSection title={uiText("Foods")} items={user.favoriteFoods} icon={Utensils} />
            <DetailSection title={uiText("Music Genres")} items={user.musicGenres} icon={Music} />
          </CardContent>
        </Card>
      )}

      {/* Lifestyle & Status */}
      {(user.relationshipStatus || user.petPreferences || user.lifestyle) && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Users className="w-5 h-5" />
              {uiText("Lifestyle & Status")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.relationshipStatus && (
              <DetailSection 
                title={uiText("Relationship Status")} 
                singleValue={formatRelationshipStatus(user.relationshipStatus)} 
                icon={Heart} 
              />
            )}
            {user.petPreferences && (
              <DetailSection 
                title={uiText("Pet Preferences")} 
                singleValue={formatPetPreferences(user.petPreferences)} 
                icon={PawPrint} 
              />
            )}
            {user.lifestyle && (
              <DetailSection 
                title={uiText("Lifestyle")} 
                singleValue={formatLifestyle(user.lifestyle)} 
                icon={Users} 
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Entertainment */}
      {(user.favoriteMovies?.length > 0 || user.favoriteBooks?.length > 0) && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Film className="w-5 h-5" />
              {uiText("Entertainment")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailSection title={uiText("Movies")} items={user.favoriteMovies} icon={Film} />
            <DetailSection title={uiText("Books")} items={user.favoriteBooks} icon={BookOpen} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}