
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, Loader2, User } from "lucide-react";
import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile, getUser } from "@/app/actions";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const formSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Invalid email address."),
  dob: z.date().optional().nullable(),
  experience: z.string().optional(),
  goals: z.string().optional(),
  photoURL: z.string().url().optional().nullable(),
});

interface ProfileSettingsProps {
    userId: string;
    role: string;
}

export default function ProfileSettings({ userId, role }: ProfileSettingsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      dob: undefined,
      experience: "",
      goals: "",
      photoURL: "",
    },
  });

  useEffect(() => {
    async function fetchUser() {
      setIsFetchingUser(true);
      const result = await getUser(userId);
      if (result.success && result.user) {
        form.reset({
          name: result.user.name || "",
          email: result.user.email || "",
          dob: result.user.dob ? new Date(result.user.dob) : undefined,
          experience: result.user.experience || "",
          goals: result.user.goals || "",
          photoURL: result.user.photoURL || "",
        });
        if (result.user.photoURL) {
            setImagePreview(result.user.photoURL);
        }
      } else {
        toast({ variant: 'destructive', title: "Error", description: "Failed to load user profile." });
      }
      setIsFetchingUser(false);
    }
    if (userId) {
      fetchUser();
    }
  }, [userId, form, toast]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    let uploadedPhotoURL = values.photoURL;

    if (imageFile) {
        try {
            const storageRef = ref(storage, `profile_pictures/${userId}/${imageFile.name}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            uploadedPhotoURL = await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Error uploading image:", error);
            toast({ variant: "destructive", title: "Image Upload Failed", description: "Could not upload your profile picture." });
            setIsSubmitting(false);
            return;
        }
    }
    
    const result = await updateUserProfile({ 
        userId,
        name: values.name,
        email: values.email,
        experience: values.experience,
        goals: values.goals,
        dob: values.dob ? values.dob.toISOString().split('T')[0] : null,
        photoURL: uploadedPhotoURL,
    });

    if (result.success) {
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
      router.push(`/dashboard?role=${role}&userId=${userId}`);
    } else {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: result.message,
      });
    }
    setIsSubmitting(false);
  }

  if (isFetchingUser) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Loading your profile...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your personal information and goals.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={imagePreview || `https://picsum.photos/seed/${userId}/100/100`} alt="Profile" />
                    <AvatarFallback><User className="h-12 w-12"/></AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                    <FormLabel>Profile Photo</FormLabel>
                    <Input id="picture" type="file" accept="image/*" onChange={handleImageChange} />
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                           <Calendar
                                captionLayout="dropdown-buttons"
                                fromYear={1920}
                                toYear={new Date().getFullYear()}
                                mode="single"
                                selected={field.value ?? undefined}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Experience Level</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Beginner, Intermediate" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fitness Goals</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your fitness goals..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Profile
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
