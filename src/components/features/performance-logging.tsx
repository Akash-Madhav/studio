
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Camera, Video, Upload, CheckCircle, XCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { logWorkout } from "@/app/actions";
import { analyzeWorkoutVideo, VideoAnalysisOutput } from "@/ai/flows/video-workout-analysis-flow";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  exercise: z.string().min(2, "Exercise name is required."),
  reps: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  time: z.string().optional(),
  distance: z.coerce.number().min(0).optional(),
});

interface PerformanceLoggingProps {
    userId?: string;
    onWorkoutLogged: () => void;
}

export default function PerformanceLogging({ userId, onWorkoutLogged }: PerformanceLoggingProps) {
  const { toast } = useToast();
  const [isLogging, setIsLogging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisOutput | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);

  const handleStartRecording = () => {
    if (videoRef.current?.srcObject) {
      setAnalysisResult(null);
      const stream = videoRef.current.srcObject as MediaStream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(videoBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          await handleAnalyzeVideo(base64data);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const handleAnalyzeVideo = async (videoDataUri: string) => {
    setIsAnalyzing(true);
    try {
        const result = await analyzeWorkoutVideo({ videoDataUri });
        setAnalysisResult(result);
    } catch (error) {
        console.error("Error analyzing video:", error);
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "Could not analyze the workout video. Please try again.",
        });
    } finally {
        setIsAnalyzing(false);
    }
  };
  
  const handleLogAnalyzedWorkout = async () => {
    if (!analysisResult || !userId) return;

    setIsLogging(true);
    const result = await logWorkout({
        userId,
        exercise: analysisResult.exercise,
        reps: analysisResult.reps,
        weight: analysisResult.weight,
        time: analysisResult.time,
        distance: analysisResult.distance,
    });
    setIsLogging(false);

    if (result.success) {
      toast({
        title: "Workout Logged!",
        description: `${analysisResult.exercise} has been added to your history.`,
      });
      setAnalysisResult(null);
      onWorkoutLogged();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message || "Failed to log workout.",
      });
    }
  }


  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>AI-Powered Workout Analysis</CardTitle>
        <CardDescription>
          Record your exercise and let our AI analyze your form and count your reps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-muted rounded-md overflow-hidden border">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                    <Camera className="h-12 w-12 mb-4" />
                    <p className="text-center font-semibold">Camera access is required.</p>
                    <p className="text-center text-sm">Please enable camera permissions in your browser settings.</p>
                </div>
            )}
             {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
                    <Loader2 className="h-12 w-12 animate-spin mb-4" />
                    <p className="text-center font-semibold">Analyzing your workout...</p>
                    <p className="text-center text-sm">This may take a moment.</p>
                </div>
            )}
        </div>

        {hasCameraPermission === false && (
            <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                    Please allow camera access to use this feature.
                </AlertDescription>
            </Alert>
        )}

        {isRecording ? (
          <Button onClick={handleStopRecording} className="w-full" variant="destructive">
            <Video className="mr-2" /> Stop Recording
          </Button>
        ) : (
          <Button onClick={handleStartRecording} className="w-full" disabled={!hasCameraPermission || isAnalyzing}>
            <Camera className="mr-2" /> Start Recording
          </Button>
        )}

        {analysisResult && (
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-xl">Analysis Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-semibold">Exercise</p>
                            <p>{analysisResult.exercise}</p>
                        </div>
                         {analysisResult.reps && <div>
                            <p className="font-semibold">Reps</p>
                            <p>{analysisResult.reps}</p>
                        </div>}
                        {analysisResult.weight && <div>
                            <p className="font-semibold">Weight (est.)</p>
                            <p>{analysisResult.weight} kg</p>
                        </div>}
                        {analysisResult.time && <div>
                            <p className="font-semibold">Time</p>
                            <p>{analysisResult.time}</p>
                        </div>}
                         {analysisResult.distance && <div>
                            <p className="font-semibold">Distance (est.)</p>
                            <p>{analysisResult.distance} km</p>
                        </div>}
                    </div>
                    <div>
                        <p className="font-semibold text-sm mb-1">Analysis Confidence</p>
                        <Progress value={analysisResult.accuracy.score} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1.5">{analysisResult.accuracy.justification}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleLogAnalyzedWorkout} disabled={isLogging}>
                        {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2"/> }
                        Log This Workout
                    </Button>
                </CardFooter>
            </Card>
        )}

      </CardContent>
    </Card>
  );
}
