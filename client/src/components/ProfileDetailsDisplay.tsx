import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MapPin, Utensils, Music, Users, BookOpen, Film, Gamepad2, PawPrint } from "lucide-react";

interface ProfileDetailsDisplayProps {
  user: any;
}

export function ProfileDetailsDisplay({ user }: ProfileDetailsDisplayProps) {
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
          <p className="text-muted-foreground">No profile details added yet</p>
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
              {item}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  const formatRelationshipStatus = (status: string) => {
    switch (status) {
      case "single": return "Single";
      case "taken": return "In a relationship";
      case "married": return "Married";
      case "complicated": return "It's complicated";
      case "prefer-not-to-say": return "Prefer not to say";
      default: return status;
    }
  };

  const formatPetPreferences = (pref: string) => {
    switch (pref) {
      case "dogs": return "Dog lover";
      case "cats": return "Cat lover";
      case "both": return "Loves dogs & cats";
      case "other": return "Other pets";
      case "none": return "No pets";
      default: return pref;
    }
  };

  const formatLifestyle = (lifestyle: string) => {
    return lifestyle.charAt(0).toUpperCase() + lifestyle.slice(1);
  };

  return (
    <div className="space-y-4">
      {/* Interests & Hobbies */}
      {(user.interests?.length > 0 || user.hobbies?.length > 0) && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Interests & Hobbies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailSection title="Interests" items={user.interests} icon={Heart} />
            <DetailSection title="Hobbies" items={user.hobbies} icon={Gamepad2} />
          </CardContent>
        </Card>
      )}

      {/* Favorites */}
      {(user.favoriteLocations?.length > 0 || user.favoriteFoods?.length > 0 || user.musicGenres?.length > 0) && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Favorites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailSection title="Favorite Places" items={user.favoriteLocations} icon={MapPin} />
            <DetailSection title="Favorite Foods" items={user.favoriteFoods} icon={Utensils} />
            <DetailSection title="Music Genres" items={user.musicGenres} icon={Music} />
          </CardContent>
        </Card>
      )}

      {/* Lifestyle & Status */}
      {(user.relationshipStatus || user.petPreferences || user.lifestyle) && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Users className="w-5 h-5" />
              Lifestyle & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.relationshipStatus && (
              <DetailSection 
                title="Relationship Status" 
                singleValue={formatRelationshipStatus(user.relationshipStatus)} 
                icon={Heart} 
              />
            )}
            {user.petPreferences && (
              <DetailSection 
                title="Pet Preferences" 
                singleValue={formatPetPreferences(user.petPreferences)} 
                icon={PawPrint} 
              />
            )}
            {user.lifestyle && (
              <DetailSection 
                title="Lifestyle" 
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
              Entertainment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailSection title="Favorite Movies" items={user.favoriteMovies} icon={Film} />
            <DetailSection title="Favorite Books" items={user.favoriteBooks} icon={BookOpen} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}