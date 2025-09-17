
"use client";

import { useState } from "react";
import { Loader2, Upload, Sparkles, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzePhysique, PhysiqueAnalysisOutput } from "@/ai/flows/physique-analysis-flow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Progress } from "../ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";

export default function PhysiqueRater() {
    const { toast } = useToast();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<PhysiqueAnalysisOutput | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAnalysisResult(null);
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setImagePreviewUrl(url);
        }
    };

    const handleAnalyzePhysique = () => {
        if (!imageFile) return;

        setIsAnalyzing(true);
        setAnalysisResult(null);
        
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onloadend = async () => {
            const base64data = reader.result as string;
            try {
                const result = await analyzePhysique({ photoDataUri: base64data });
                setAnalysisResult(result);
            } catch (error: any) {
                console.error("Error analyzing physique:", error);
                let errorDescription = "Could not analyze the photo. Please try again.";
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
    };

    return (
        <div className="grid md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>AI Physique Analysis</CardTitle>
                    <CardDescription>
                        Upload a photo to get an AI-powered analysis of your physique, including muscle group ratings and recommendations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative aspect-video bg-muted rounded-md overflow-hidden border">
                        {imagePreviewUrl ? (
                            <Image src={imagePreviewUrl} alt="Physique preview" layout="fill" objectFit="contain" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4">
                                <ImageIcon className="h-12 w-12 mb-4" />
                                <p className="text-center font-semibold">Upload a photo to get started</p>
                            </div>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Input id="physique-upload" type="file" accept="image/*" onChange={handleFileChange} disabled={isAnalyzing}/>
                        <Button onClick={handleAnalyzePhysique} disabled={!imageFile || isAnalyzing}>
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2" />
                                    Analyze My Physique
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                    <CardDescription>
                        Here's your personalized physique breakdown from our AI coach.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isAnalyzing && (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    {analysisResult ? (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-primary mb-2">Muscle Group Ratings</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Muscle Group</TableHead>
                                            <TableHead>Rating (1-10)</TableHead>
                                            <TableHead>Comment</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.entries(analysisResult.muscleGroups).map(([group, data]) => (
                                            <TableRow key={group}>
                                                <TableCell className="capitalize font-medium">{group}</TableCell>
                                                <TableCell><Badge variant="secondary">{data.rating}/10</Badge></TableCell>
                                                <TableCell>{data.comment}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                             <div>
                                <h3 className="font-semibold text-primary mb-2">Overall Symmetry</h3>
                                <div className="p-4 bg-muted/50 rounded-md space-y-2">
                                    <div className="flex items-center gap-4">
                                        <Badge variant="default" className="text-lg">{analysisResult.symmetry.rating}/10</Badge>
                                        <p className="text-sm text-muted-foreground flex-1">{analysisResult.symmetry.comment}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-primary mb-2">Recommendations</h3>
                                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                    {analysisResult.recommendations.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        !isAnalyzing && (
                        <div className="text-center text-muted-foreground py-12">
                            Your analysis will appear here.
                        </div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
