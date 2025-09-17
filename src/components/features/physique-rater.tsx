
"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Sparkles, Camera, Upload, Video, FileVideo, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzePhysique, PhysiqueAnalysisOutput } from "@/ai/flows/physique-analysis-flow";
import { logPhysiqueAnalysis } from "@/app/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PhysiqueRaterProps {
    userId: string;
}

export default function PhysiqueRater({ userId }: PhysiqueRaterProps) {
    const { toast } = useToast();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<PhysiqueAnalysisOutput | null>(null);
    const [activeTab, setActiveTab] = useState("live");
    
    // Video state
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    
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
    }, [activeTab]);

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

            mediaRecorderRef.current.onstop = () => {
                const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
                const reader = new FileReader();
                reader.readAsDataURL(videoBlob);
                reader.onloadend = async () => {
                    const base64data = reader.result as string;
                    await handleAnalyzePhysique(base64data);
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
            await handleAnalyzePhysique(base64data);
        };
    }

    const handleAnalyzePhysique = async (videoDataUri: string) => {
        if (!videoDataUri) {
            toast({ variant: "destructive", title: "No Video", description: "Please record or upload a video first." });
            return;
        }

        setIsAnalyzing(true);
        setAnalysisResult(null);
        
        try {
            const result = await analyzePhysique({ videoDataUri });
            setAnalysisResult(result);
        } catch (error: any) {
            console.error("Error analyzing physique:", error);
            let errorDescription = "Could not analyze the video. Please try again.";
             if (error.message?.includes("503") || error.message?.includes("overloaded")) {
                errorDescription = "The AI model is currently busy. Please wait a moment and try again.";
            } else if (error.message) {
                errorDescription = `Analysis failed: ${error.message}`;
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

    const handleLogAnalysis = async () => {
        if (!analysisResult || !userId) return;

        setIsLogging(true);
        const result = await logPhysiqueAnalysis(userId, analysisResult.summary);
        if (result.success) {
            toast({ title: "Analysis Logged", description: "Your physique analysis has been saved." });
            setAnalysisResult(null); // Clear the result after logging
            setVideoFile(null);
            setVideoPreviewUrl(null);
        } else {
            toast({ variant: "destructive", title: "Logging Failed", description: result.message });
        }
        setIsLogging(false);
    };

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>AI Physique Analysis</CardTitle>
                    <CardDescription>
                        Record or upload a short video of your physique to get an AI-powered analysis.
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
                                {hasCameraPermission === false && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                                        <Camera className="h-12 w-12 mb-4" />
                                        <p className="text-center font-semibold">Camera access is required.</p>
                                    </div>
                                )}
                                {isAnalyzing && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
                                        <Loader2 className="h-12 w-12 animate-spin mb-4" />
                                        <p className="text-center font-semibold">Analyzing your physique...</p>
                                    </div>
                                )}
                            </div>
                            {hasCameraPermission === false && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertTitle>Camera Access Denied</AlertTitle>
                                    <AlertDescription>Please enable camera permissions in your browser settings.</AlertDescription>
                                </Alert>
                            )}
                            <div className="grid gap-2 mt-4">
                               {isRecording ? (
                                    <Button onClick={handleStopRecording} className="w-full mt-4" variant="destructive">
                                        <Video className="mr-2" /> Stop Recording & Analyze
                                    </Button>
                                    ) : (
                                    <Button onClick={handleStartRecording} className="w-full mt-4" disabled={!hasCameraPermission || isAnalyzing}>
                                        <Camera className="mr-2" /> Start Recording
                                    </Button>
                                )}
                            </div>
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
                                        <p className="text-center font-semibold">Analyzing your physique...</p>
                                    </div>
                                )}
                            </div>
                            <div className="grid gap-2 mt-4">
                                <Input id="physique-upload" type="file" accept="video/*" onChange={handleFileChange} disabled={isAnalyzing}/>
                                <Button onClick={handleAnalyzeUpload} disabled={!videoFile || isAnalyzing}>
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2" />
                                            Analyze Uploaded Video
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {analysisResult && (
                <Card>
                    <CardHeader>
                        <CardTitle>Analysis Summary</CardTitle>
                        <CardDescription>
                            Here's your personalized physique summary. You can log it to track your progress.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">{analysisResult.summary}</p>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleLogAnalysis} disabled={isLogging}>
                            {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2"/> }
                            Log This Analysis
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
