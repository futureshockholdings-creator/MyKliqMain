import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { User, Heart, MapPin, Utensils, Music, Users, BookOpen, Film, Gamepad2, X, Plus, Calendar, Phone, Mail } from "lucide-react";

const TagInput = ({ 
  label, 
  items, 
  setItems, 
  newItem, 
  setNewItem, 
  placeholder,
  icon: Icon,
  addItem,
  removeItem
}: {
  label: string;
  items: string[];
  setItems: (items: string[]) => void;
  newItem: string;
  setNewItem: (item: string) => void;
  placeholder: string;
  icon: any;
  addItem: (items: string[], setItems: (items: string[]) => void, newItem: string, setNewItem: (item: string) => void) => void;
  removeItem: (items: string[], setItems: (items: string[]) => void, itemToRemove: string) => void;
}) => (
  <div className="space-y-2">
    <Label className="text-foreground flex items-center gap-2">
      <Icon className="w-4 h-4" />
      {label}
    </Label>
    <div className="flex gap-2">
      <Input
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
        placeholder={placeholder}
        className="bg-input border-border text-foreground flex-1"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addItem(items, setItems, newItem, setNewItem);
          }
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => addItem(items, setItems, newItem, setNewItem)}
        className="border-primary text-primary hover:bg-primary/20"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          {item}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-auto p-0 text-muted-foreground hover:text-foreground"
            onClick={() => removeItem(items, setItems, item)}
          >
            <X className="w-3 h-3" />
          </Button>
        </Badge>
      ))}
    </div>
  </div>
);

export default function Signup() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Security Setup, 3: About You
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Get invite code from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('inviteCode');
    if (code) {
      setInviteCode(code);
    }
  }, []);

  // Basic profile fields - required for signup
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [kliqName, setKliqName] = useState("My Kliq");
  const [birthdate, setBirthdate] = useState("");

  // Security setup fields - required for signup
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityAnswer1, setSecurityAnswer1] = useState("");
  const [securityAnswer2, setSecurityAnswer2] = useState("");
  const [securityAnswer3, setSecurityAnswer3] = useState("");
  const [securityPin, setSecurityPin] = useState("");

  // Extended profile details - optional
  const [interests, setInterests] = useState<string[]>([]);
  const [favoriteLocations, setFavoriteLocations] = useState<string[]>([]);
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>([]);
  const [musicGenres, setMusicGenres] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<string[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<string[]>([]);
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [petPreferences, setPetPreferences] = useState("");
  const [lifestyle, setLifestyle] = useState("");

  // Input states for adding new items
  const [newInterest, setNewInterest] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newFood, setNewFood] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [newHobby, setNewHobby] = useState("");
  const [newMovie, setNewMovie] = useState("");
  const [newBook, setNewBook] = useState("");
  
  // Terms acceptance checkbox
  const [termsAccepted, setTermsAccepted] = useState(false);

  const addItem = (items: string[], setItems: (items: string[]) => void, newItem: string, setNewItem: (item: string) => void) => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      setItems([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (items: string[], setItems: (items: string[]) => void, itemToRemove: string) => {
    setItems(items.filter(item => item !== itemToRemove));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate Basic Info before proceeding
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !phoneNumber.trim()) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields (name, email, phone number)",
          variant: "destructive"
        });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate Security Setup before proceeding
      if (!password || !confirmPassword || !securityAnswer1 || !securityAnswer2 || !securityAnswer3 || !securityPin) {
        toast({
          title: "Missing Security Information",
          description: "Please complete all security setup fields",
          variant: "destructive"
        });
        return;
      }

      // Validate password match
      if (password !== confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match",
          variant: "destructive"
        });
        return;
      }

      // Validate password strength
      if (password.length < 10 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
        toast({
          title: "Weak Password",
          description: "Password must be at least 10 characters with letters, numbers, and special characters",
          variant: "destructive"
        });
        return;
      }

      // Validate PIN (4 digits)
      if (!/^\d{4}$/.test(securityPin)) {
        toast({
          title: "Invalid PIN",
          description: "Security PIN must be exactly 4 digits",
          variant: "destructive"
        });
        return;
      }

      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phoneNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (name, email, phone number)",
        variant: "destructive"
      });
      return;
    }

    // Validate security setup fields
    if (!password || !confirmPassword || !securityAnswer1 || !securityAnswer2 || !securityAnswer3 || !securityPin) {
      toast({
        title: "Missing Security Information",
        description: "Please complete all security setup fields (password, security questions, and PIN)",
        variant: "destructive"
      });
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    // Validate password strength
    if (password.length < 10 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 10 characters with letters, numbers, and special characters",
        variant: "destructive"
      });
      return;
    }

    // Validate PIN (4 digits)
    if (!/^\d{4}$/.test(securityPin)) {
      toast({
        title: "Invalid PIN",
        description: "Security PIN must be exactly 4 digits",
        variant: "destructive"
      });
      return;
    }

    // Validate terms acceptance
    if (!termsAccepted) {
      toast({
        title: "Terms Not Accepted",
        description: "You must agree to the Privacy Policy, Disclaimer, and Community Guidelines to create an account",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/auth/signup", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        bio: bio.trim(),
        kliqName: kliqName.trim(),
        birthdate: birthdate || null,
        password: password.trim(),
        securityAnswer1: securityAnswer1.trim(),
        securityAnswer2: securityAnswer2.trim(),
        securityAnswer3: securityAnswer3.trim(),
        securityPin: securityPin.trim(),
        interests,
        favoriteLocations,
        favoriteFoods,
        musicGenres,
        hobbies,
        favoriteMovies,
        favoriteBooks,
        relationshipStatus: relationshipStatus || null,
        petPreferences: petPreferences || null,
        lifestyle: lifestyle || null,
        inviteCode: inviteCode || undefined
      });

      toast({
        title: "Welcome to MyKliq!",
        description: "Your profile has been created successfully.",
      });

      // Redirect to home page
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Welcome to MyKliq!</h1>
          <p className="text-muted-foreground">Create your profile to join your exclusive social circle</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <User className="w-5 h-5" />
              Create Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress indicator */}
              <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  1
                </div>
                <div className={`h-1 w-12 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  2
                </div>
                <div className={`h-1 w-12 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  3
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {currentStep === 1 && "Basic Information"}
                  {currentStep === 2 && "Security Setup"}
                  {currentStep === 3 && "About You"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentStep === 1 && "Tell us who you are"}
                  {currentStep === 2 && "Secure your account"}
                  {currentStep === 3 && "Share your interests (optional)"}
                </p>
              </div>

              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      First Name *
                    </Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Your first name"
                      className="bg-input border-border text-foreground"
                      data-testid="input-first-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Last Name *
                    </Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Your last name"
                      className="bg-input border-border text-foreground"
                      data-testid="input-last-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email *
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="bg-input border-border text-foreground"
                      data-testid="input-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number *
                    </Label>
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="bg-input border-border text-foreground"
                      data-testid="input-phone"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Birthday
                    </Label>
                    <Input
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="bg-input border-border text-foreground"
                      data-testid="input-birthdate"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-foreground">Kliq Name</Label>
                    <Input
                      value={kliqName}
                      onChange={(e) => setKliqName(e.target.value)}
                      placeholder="My Kliq"
                      className="bg-input border-border text-foreground"
                      data-testid="input-kliq-name"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-foreground">Bio</Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="bg-input border-border text-foreground resize-none"
                      rows={3}
                      data-testid="input-bio"
                    />
                  </div>
                </div>
                </div>
              )}

              {/* Step 2: Security Setup */}
              {currentStep === 2 && (
                <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Password *</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter secure password"
                      className="bg-input border-border text-foreground"
                      data-testid="input-password"
                    />
                    <p className="text-xs text-muted-foreground">
                      At least 10 characters with letters, numbers, and special characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Confirm Password *</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="bg-input border-border text-foreground"
                      data-testid="input-confirm-password"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-foreground">Security Questions *</Label>
                    <p className="text-sm text-muted-foreground">These will help you recover your account if needed</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">What was your first car? *</Label>
                    <Input
                      value={securityAnswer1}
                      onChange={(e) => setSecurityAnswer1(e.target.value)}
                      placeholder="Your answer"
                      className="bg-input border-border text-foreground"
                      data-testid="input-security-answer-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">What is your mother's maiden name? *</Label>
                    <Input
                      value={securityAnswer2}
                      onChange={(e) => setSecurityAnswer2(e.target.value)}
                      placeholder="Your answer"
                      className="bg-input border-border text-foreground"
                      data-testid="input-security-answer-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">What was your favorite teacher's last name? *</Label>
                    <Input
                      value={securityAnswer3}
                      onChange={(e) => setSecurityAnswer3(e.target.value)}
                      placeholder="Your answer"
                      className="bg-input border-border text-foreground"
                      data-testid="input-security-answer-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">4-Digit Security PIN *</Label>
                    <Input
                      type="password"
                      value={securityPin}
                      onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="1234"
                      maxLength={4}
                      className="bg-input border-border text-foreground"
                      data-testid="input-security-pin"
                    />
                    <p className="text-xs text-muted-foreground">
                      For additional account verification
                    </p>
                  </div>
                </div>
                </div>
              )}

              {/* Step 3: About You */}
              {currentStep === 3 && (
                <div className="space-y-6">
                <div className="grid gap-6">
                  <TagInput
                    label="Interests & Hobbies"
                    items={interests}
                    setItems={setInterests}
                    newItem={newInterest}
                    setNewItem={setNewInterest}
                    placeholder="Add an interest"
                    icon={Heart}
                    addItem={addItem}
                    removeItem={removeItem}
                  />

                  <TagInput
                    label="Hobbies"
                    items={hobbies}
                    setItems={setHobbies}
                    newItem={newHobby}
                    setNewItem={setNewHobby}
                    placeholder="Add a hobby"
                    icon={Gamepad2}
                    addItem={addItem}
                    removeItem={removeItem}
                  />

                  <TagInput
                    label="Favorite Locations"
                    items={favoriteLocations}
                    setItems={setFavoriteLocations}
                    newItem={newLocation}
                    setNewItem={setNewLocation}
                    placeholder="Add a place"
                    icon={MapPin}
                    addItem={addItem}
                    removeItem={removeItem}
                  />

                  <TagInput
                    label="Favorite Foods"
                    items={favoriteFoods}
                    setItems={setFavoriteFoods}
                    newItem={newFood}
                    setNewItem={setNewFood}
                    placeholder="Add a food"
                    icon={Utensils}
                    addItem={addItem}
                    removeItem={removeItem}
                  />

                  <TagInput
                    label="Music Genres"
                    items={musicGenres}
                    setItems={setMusicGenres}
                    newItem={newGenre}
                    setNewItem={setNewGenre}
                    placeholder="Add a genre"
                    icon={Music}
                    addItem={addItem}
                    removeItem={removeItem}
                  />

                  <TagInput
                    label="Favorite Movies"
                    items={favoriteMovies}
                    setItems={setFavoriteMovies}
                    newItem={newMovie}
                    setNewItem={setNewMovie}
                    placeholder="Add a movie"
                    icon={Film}
                    addItem={addItem}
                    removeItem={removeItem}
                  />

                  <TagInput
                    label="Favorite Books"
                    items={favoriteBooks}
                    setItems={setFavoriteBooks}
                    newItem={newBook}
                    setNewItem={setNewBook}
                    placeholder="Add a book"
                    icon={BookOpen}
                    addItem={addItem}
                    removeItem={removeItem}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Relationship Status</Label>
                      <Select value={relationshipStatus} onValueChange={setRelationshipStatus}>
                        <SelectTrigger className="bg-input border-border text-foreground">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="taken">In a relationship</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="complicated">It's complicated</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Pet Preferences</Label>
                      <Select value={petPreferences} onValueChange={setPetPreferences}>
                        <SelectTrigger className="bg-input border-border text-foreground">
                          <SelectValue placeholder="Select preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dogs">Dogs</SelectItem>
                          <SelectItem value="cats">Cats</SelectItem>
                          <SelectItem value="both">Both dogs and cats</SelectItem>
                          <SelectItem value="other">Other pets</SelectItem>
                          <SelectItem value="none">No pets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Lifestyle</Label>
                      <Select value={lifestyle} onValueChange={setLifestyle}>
                        <SelectTrigger className="bg-input border-border text-foreground">
                          <SelectValue placeholder="Select lifestyle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="relaxed">Relaxed</SelectItem>
                          <SelectItem value="adventurous">Adventurous</SelectItem>
                          <SelectItem value="homebody">Homebody</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="creative">Creative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                </div>
              )}

              {/* Terms and Conditions Checkbox - Shown on Step 3 */}
              {currentStep === 3 && (
                <div className="space-y-4 pt-4 pb-2">
                  <div className="border border-border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms-checkbox"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                        className="mt-1"
                        data-testid="checkbox-terms-acceptance"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="terms-checkbox"
                          className="text-sm text-foreground leading-relaxed cursor-pointer"
                        >
                          I agree to the{" "}
                          <Link 
                            href="/privacy-policy" 
                            className="text-primary hover:underline font-medium"
                            target="_blank"
                            data-testid="link-privacy-policy"
                          >
                            Privacy Policy
                          </Link>
                          {", "}
                          <Link 
                            href="/disclaimer" 
                            className="text-primary hover:underline font-medium"
                            target="_blank"
                            data-testid="link-disclaimer"
                          >
                            Disclaimer
                          </Link>
                          {", and "}
                          <Link 
                            href="/community-guidelines" 
                            className="text-primary hover:underline font-medium"
                            target="_blank"
                            data-testid="link-community-guidelines"
                          >
                            Community Guidelines
                          </Link>
                          {" *"}
                        </label>
                        <p className="text-xs text-muted-foreground mt-2">
                          By creating an account, you acknowledge that you have read and agree to our policies
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  onClick={handlePreviousStep}
                  disabled={currentStep === 1}
                  variant="outline"
                  className={currentStep === 1 ? "invisible" : ""}
                  data-testid="button-previous-step"
                >
                  Previous
                </Button>
                
                <Button
                  onClick={currentStep === 3 ? handleSubmit : handleNextStep}
                  disabled={isSubmitting}
                  className="px-8"
                  data-testid={currentStep === 3 ? "button-create-profile" : "button-next-step"}
                >
                  {isSubmitting 
                    ? "Creating Profile..." 
                    : currentStep === 3 
                      ? "Create Profile" 
                      : "Next Step"
                  }
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}