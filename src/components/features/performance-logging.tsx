"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Video, UploadCloud, Rocket, Lightbulb, Camera, Circle, StopCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { logWorkout } from "@/app/actions";
import { analyzeWorkoutVideo, VideoAnalysisOutput } from "@/ai/flows/video-workout-analysis-flow";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  exercise: z.string().min(2, "Exercise name is required."),
  reps: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  time: z.string().optional(),
  distance: z.coerce.number().min(0).optional(),
});

export default function PerformanceLogging({ userId }: { userId?: string }) {
  const { toast } = useToast();
  const [isLogging, setIsLogging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [videoMode, setVideoMode] = useState<'upload' | 'camera'>('upload');
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisOutput | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exercise: "",
      reps: undefined,
      weight: undefined,
      time: "",
      distance: undefined,
    },
  });

  const cleanupCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };
  
  useEffect(() => {
    return () => {
      cleanupCamera();
    }
  }, []);

  const getCameraPermission = async () => {
      if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
        toast({ variant: 'destructive', title: 'Camera Not Supported', description: 'Your browser does not support camera access.'});
        setHasCameraPermission(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.reset();
      setAnalysisResult(null);
    }
  };

  const handleAnalyzeVideo = async () => {
    if (!videoFile) {
        toast({
            variant: 'destructive',
            title: 'No Video Selected',
            description: 'Please upload or record a video to analyze.'
        });
        return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
        const videoDataUri = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(videoFile);
        });

        const result = await analyzeWorkoutVideo({ videoDataUri });
        setAnalysisResult(result);
        
        form.setValue('exercise', result.exercise || '');
        form.setValue('reps', result.reps);
        form.setValue('weight', result.weight);
        form.setValue('time', result.time);
        form.setValue('distance', result.distance);

        toast({
            title: 'Analysis Complete!',
            description: 'The workout details have been filled in below. Please review and save.',
        });

    } catch (error) {
        console.error("Error analyzing video:", error);
        toast({
            variant: 'destructive',
            title: 'Analysis Failed',
            description: 'There was an error analyzing your video. Please try again.'
        });
    } finally {
        setIsAnalyzing(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to log a workout.",
      });
      return;
    }
    setIsLogging(true);
    const result = await logWorkout({ ...values, userId });
    setIsLogging(false);

    if (result.success) {
      toast({
        title: "Workout Logged!",
        description: result.message,
      });
      form.reset();
      setVideoPreview(null);
      setVideoFile(null);
      setAnalysisResult(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
  }

  const handleStartRecording = () => {
    if (videoRef.current?.srcObject) {
      setIsRecording(true);
      setRecordedChunks([]);
      const stream = videoRef.current.srcObject as MediaStream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      mediaRecorderRef.current.start();
    }
  };

  const handleStopRecording = async () => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.onstop = async () => {
            // A small delay to ensure all data is available
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const videoBlob = new Blob(recordedChunks, { type: "video/webm" });
            const videoUrl = URL.createObjectURL(videoBlob);
            const videoFile = new File([videoBlob], 'recorded-workout.webm', { type: 'video/webm' });
            
            setVideoPreview(videoUrl);
            setVideoFile(videoFile);
            setIsRecording(false);
            cleanupCamera();
            setVideoMode('upload');
            setHasCameraPermission(null);
        };
    }
  };

  const isFormPopulated = form.watch('exercise') !== '';

  const resetAll = () => {
    form.reset();
    setVideoPreview(null);
    setVideoFile(null);
    setAnalysisResult(null);
    setRecordedChunks([]);
    setIsRecording(false);
    cleanupCamera();
    setVideoMode('upload');
    setHasCameraPermission(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Log New Workout with AI</CardTitle>
        <CardDescription>
          Upload a video or use your webcam to let our AI analyze your workout.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <FormLabel>Workout Video</FormLabel>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
                  <div className="bg-muted rounded-md aspect-video flex items-center justify-center relative">
                    {videoMode === 'upload' && (
                        <>
                            {videoPreview ? (
                                <video src={videoPreview} className="w-full aspect-video rounded-md" controls />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <UploadCloud className="mx-auto h-12 w-12" />
                                    <p>Upload or record a video to get started</p>
                                </div>
                            )}
                        </>
                    )}
                    {videoMode === 'camera' && (
                        <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
                    )}

                     {isAnalyzing && (
                      <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-md">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-lg font-semibold">Analyzing your form...</p>
                        <p className="text-sm text-muted-foreground">This may take a moment.</p>
                      </div>
                    )}

                    {videoMode === 'camera' && hasCameraPermission === false && (
                       <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-md p-4">
                         <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access in your browser to use this feature. You may need to refresh the page.
                            </AlertDescription>
                        </Alert>
                       </div>
                    )}
                  </div>
                
                  <div className="flex gap-2 flex-wrap">
                      {videoMode === 'upload' && (
                          <>
                            <Button asChild variant="outline">
                                <label htmlFor="video-upload">
                                <UploadCloud className="mr-2" />
                                {videoFile ? 'Change Video' : 'Upload Video'}
                                <input 
                                    ref={fileInputRef}
                                    id="video-upload" 
                                    type="file" 
                                    accept="video/*" 
                                    className="sr-only" 
                                    onChange={handleFileChange}
                                    disabled={isAnalyzing}
                                />
                                </label>
                            </Button>
                             <Button type="button" variant="outline" onClick={() => {
                                 resetAll();
                                 setVideoMode('camera');
                                 getCameraPermission();
                             }}>
                                 <Camera className="mr-2"/>
                                 Use Webcam
                             </Button>
                          </>
                      )}

                      {videoMode === 'camera' && hasCameraPermission && (
                          <>
                           {!isRecording ? (
                               <Button type="button" onClick={handleStartRecording}>
                                   <Circle className="mr-2 text-red-500 fill-current" />
                                   Start Recording
                               </Button>
                           ) : (
                               <Button type="button" onClick={handleStopRecording} variant="destructive">
                                   <StopCircle className="mr-2" />
                                   Stop Recording
                               </Button>
                           )}
                           <Button type="button" variant="ghost" onClick={() => {
                               cleanupCamera();
                               setVideoMode('upload');
                               setHasCameraPermission(null);
                           }}>
                               Cancel
                           </Button>
                          </>
                      )}
                      
                      <Button 
                        type="button" 
                        onClick={handleAnalyzeVideo}
                        disabled={!videoFile || isAnalyzing}
                        >
                        {isAnalyzing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Rocket className="mr-2"/>
                        )}
                        Analyze Workout
                      </Button>
                  </div>
                </div>
            </div>

            {analysisResult && (
                <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>AI Analysis Accuracy: {analysisResult.accuracy.score}%</AlertTitle>
                    <AlertDescription>
                        {analysisResult.accuracy.justification}
                    </AlertDescription>
                </Alert>
            )}
          
            <FormField
              control={form.control}
              name="exercise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercise</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bench Press" {...field} disabled={!isFormPopulated}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reps</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} value={field.value ?? ''} disabled={!isFormPopulated}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 60" {...field} value={field.value ?? ''} disabled={!isFormPopulated}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 30:00" {...field} value={field.value ?? ''} disabled={!isFormPopulated}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="distance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distance (km)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 5" {...field} value={field.value ?? ''} disabled={!isFormPopulated}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <CardFooter className="px-0 pt-4">
              <Button type="submit" className="w-full" variant="default" disabled={isLogging || !isFormPopulated}>
                {isLogging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Workout
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
