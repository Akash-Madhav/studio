
"use client";

import { useState, useRef, useEffect } from "react";
import { logWorkout } from "@/app/actions";
import { analyzeWorkoutVideo, VideoAnalysisOutput } from "@/ai/flows/video-workout-analysis-flow";
import { Loader2, Camera, Video, Upload, CheckCircle, FileVideo } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "../ui/input";
import ManualWorkoutForm from "./manual-workout-form";

interface WorkoutAnalysisProps {
    userId?: string;
}

export default function WorkoutAnalysis({ userId }: WorkoutAnalysisProps) {
  const { toast } = useToast();
  const [isLogging, setIsLogging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisOutput | null>(null);
  const [activeTab, setActiveTab] = useState("live");
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

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
      } catch (error: any) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        if (error.name === 'NotAllowedError') {
             toast({
                variant: 'destructive',
                title: 'Camera Access Denied',
                description: 'Please enable camera permissions in your browser settings.',
            });
        } else if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
             toast({
                variant: 'destructive',
                title: 'Camera Timeout',
                description: 'The camera took too long to start. Please try again or check if another app is using it.',
            });
        }
      }
    };

    if (activeTab === 'live') {
        getCameraPermission();
    }
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeTab, toast]);

  const handleStartRecording = () => {
    if (videoRef.current?.srcObject) {
      setAnalysisResult(null);
      const stream = videoRef.current.srcObject as MediaStream;
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        if (recordedChunksRef.current.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Recording Error',
                description: 'The recording was too short. Please try again.',
            });
            return;
        }
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
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
    setAnalysisResult(null);
    try {
        const result = await analyzeWorkoutVideo({ videoDataUri });
        setAnalysisResult(result);
    } catch (error: any) {
        console.error("Error analyzing video:", error);
        let errorDescription = "Could not analyze the workout video. Please try again.";
        if (error.message?.includes("503") || error.message?.includes("overloaded")) {
            errorDescription = "The AI model is currently busy. Please wait a moment and try again.";
        }
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: errorDescription,
        });
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAnalysisResult(null);
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    }
  };
  
  const handleAnalyzeUpload = () => {
    if (!videoFile) return;
    
    const reader = new FileReader();
    reader.readAsDataURL(videoFile);
    reader.onloadend = async () => {
        const base64data = reader.result as string;
        await handleAnalyzeVideo(base64data);
    };
  }
  
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
      setVideoFile(null);
      setVideoPreviewUrl(null);
      // The dashboard will update automatically via its real-time listener
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message || "Failed to log workout.",
      });
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <ManualWorkoutForm userId={userId} onWorkoutLogged={() => {}} />
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Video Analysis</CardTitle>
          <CardDescription>
            Record or upload a video and let our AI analyze your form and count reps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="live"><Camera className="mr-2"/>Live</TabsTrigger>
                  <TabsTrigger value="upload"><Upload className="mr-2"/>Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="live" className="mt-4">
                  <div className="relative aspect-video bg-muted rounded-md overflow-hidden border">
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                      {hasCameraPermission === null && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                              <Loader2 className="h-8 w-8 animate-spin" />
                          </div>
                      )}
                      {hasCameraPermission === false && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                              <Camera className="h-12 w-12 mb-4" />
                              <p className="text-center font-semibold">Camera access required.</p>
                              <p className="text-center text-sm">Please enable camera permissions.</p>
                          </div>
                      )}
                      {isAnalyzing && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
                              <Loader2 className="h-12 w-12 animate-spin mb-4" />
                              <p className="text-center font-semibold">Analyzing your workout...</p>
                          </div>
                      )}
                  </div>

                  {hasCameraPermission === false && (
                      <Alert variant="destructive" className="mt-4">
                          <AlertTitle>Camera Access Required</AlertTitle>
                          <AlertDescription>
                              Please allow camera access to use this feature.
                          </AlertDescription>
                      </Alert>
                  )}
                  {isRecording ? (
                      <Button onClick={handleStopRecording} className="w-full mt-4" variant="destructive">
                          <Video className="mr-2" /> Stop Recording
                      </Button>
                      ) : (
                      <Button onClick={handleStartRecording} className="w-full mt-4" disabled={hasCameraPermission !== true || isAnalyzing}>
                          <Camera className="mr-2" /> Start Recording
                      </Button>
                  )}
              </TabsContent>
              <TabsContent value="upload" className="mt-4">
                  <div className="relative aspect-video bg-muted rounded-md overflow-hidden border">
                      {videoPreviewUrl ? (
                          <video src={videoPreviewUrl} className="w-full h-full object-cover" controls />
                      ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4">
                              <FileVideo className="h-12 w-12 mb-4" />
                              <p className="text-center font-semibold">Upload a video to analyze</p>
                          </div>
                      )}
                      {isAnalyzing && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
                              <Loader2 className="h-12 w-12 animate-spin mb-4" />
                              <p className="text-center font-semibold">Analyzing your workout...</p>
                          </div>
                      )}
                  </div>
                  <div className="grid gap-2 mt-4">
                      <Input id="video-upload" type="file" accept="video/*" onChange={handleFileChange} />
                      <Button onClick={handleAnalyzeUpload} disabled={!videoFile || isAnalyzing}>
                          <Upload className="mr-2"/>
                          Analyze Uploaded Video
                      </Button>
                  </div>
              </TabsContent>
          </Tabs>

          {analysisResult && (
              <Card className="bg-muted/50 mt-4">
                  <CardHeader>
                      <CardTitle className="text-xl">Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                              <p className="font-semibold">Exercise</p>
                              <p>{analysisResult.exercise}</p>
                          </div>
                          {analysisResult.reps !== undefined && <div>
                              <p className="font-semibold">Reps</p>
                              <p>{analysisResult.reps}</p>
                          </div>}
                          {analysisResult.weight !== undefined && <div>
                              <p className="font-semibold">Weight (est.)</p>
                              <p>{analysisResult.weight} kg</p>
                          </div>}
                          {analysisResult.time && <div>
                              <p className="font-semibold">Time</p>
                              <p>{analysisResult.time}</p>
                          </div>}
                          {analysisResult.distance !== undefined && <div>
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
    </div>
  );
}
