
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { onSnapshot, collection, query, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createPost, addComment } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, MessageSquare } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog"
import { Input } from '../ui/input';

dayjs.extend(relativeTime);

interface Post {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: Date;
    commentCount?: number;
}

interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: Date;
}

interface CommunityHubProps {
    userId: string;
    userName: string;
}

export default function CommunityHub({ userId, userName }: CommunityHubProps) {
    const { toast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const postsData = await Promise.all(snapshot.docs.map(async (d) => {
                const data = d.data();
                const createdAt = data.createdAt as Timestamp;
                const commentsQuery = query(collection(db, 'posts', d.id, 'comments'));
                const commentsSnapshot = await getDoc(doc(db, 'posts', d.id)); // Not ideal, but works for count
                
                return {
                    id: d.id,
                    authorId: data.authorId,
                    authorName: data.authorName,
                    content: data.content,
                    createdAt: createdAt ? createdAt.toDate() : new Date(),
                } as Post;
            }));
            setPosts(postsData);
            setIsLoading(false);
        }, (error) => {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load community posts.' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    useEffect(() => {
        if (!selectedPost) return;
        
        setIsLoadingComments(true);
        const q = query(collection(db, 'posts', selectedPost.id, 'comments'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(d => {
                const data = d.data();
                const createdAt = data.createdAt as Timestamp;
                return {
                    id: d.id,
                    ...data,
                    createdAt: createdAt ? createdAt.toDate() : new Date(),
                } as Comment;
            });
            setComments(commentsData);
            setIsLoadingComments(false);
        });

        return () => unsubscribe();
    }, [selectedPost]);


    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;

        setIsPosting(true);
        const result = await createPost({
            authorId: userId,
            authorName: userName,
            content: newPostContent,
        });

        if (result.success) {
            setNewPostContent('');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsPosting(false);
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !selectedPost) return;

        setIsCommenting(true);
        const result = await addComment({
            postId: selectedPost.id,
            authorId: userId,
            authorName: userName,
            content: newComment,
        });
        
        if (result.success) {
            setNewComment('');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsCommenting(false);
    }
    
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create a New Post</CardTitle>
                    <CardDescription>Share your progress, ask a question, or motivate others!</CardDescription>
                </CardHeader>
                <form onSubmit={handleCreatePost}>
                    <CardContent>
                        <Textarea
                            placeholder="What's on your mind?"
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            rows={4}
                            disabled={isPosting}
                        />
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={isPosting || !newPostContent.trim()}>
                            {isPosting && <Loader2 className="mr-2 animate-spin" />}
                            Post
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Community Feed</h2>
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : posts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">No posts yet. Be the first to share something!</p>
                ) : (
                    posts.map(post => (
                        <Dialog key={post.id} onOpenChange={(open) => { if (open) { setSelectedPost(post) } else { setSelectedPost(null); setComments([]) } }}>
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={`https://picsum.photos/seed/${post.authorId}/50/50`} data-ai-hint="person face" />
                                            <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{post.authorName}</p>
                                            <p className="text-xs text-muted-foreground">{dayjs(post.createdAt).fromNow()}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-wrap">{post.content}</p>
                                </CardContent>
                                <CardFooter>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <MessageSquare className="mr-2"/>
                                            Comment
                                        </Button>
                                    </DialogTrigger>
                                </CardFooter>
                            </Card>
                             <DialogContent className="sm:max-w-[525px]">
                                <DialogHeader>
                                    <DialogTitle>Post by {selectedPost?.authorName}</DialogTitle>
                                    <DialogDescription>
                                        {selectedPost?.content}
                                    </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="h-80 pr-4">
                                     {isLoadingComments ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="animate-spin" />
                                        </div>
                                     ) : comments.length > 0 ? (
                                        <div className="space-y-4">
                                            {comments.map(comment => (
                                                <div key={comment.id} className="flex items-start gap-3">
                                                    <Avatar className="h-8 w-8">
                                                         <AvatarImage src={`https://picsum.photos/seed/${comment.authorId}/40/40`} data-ai-hint="person face" />
                                                        <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 bg-muted/50 p-3 rounded-md">
                                                        <div className="flex justify-between items-center">
                                                            <p className="font-semibold text-sm">{comment.authorName}</p>
                                                            <p className="text-xs text-muted-foreground">{dayjs(comment.createdAt).fromNow(true)}</p>
                                                        </div>
                                                        <p className="text-sm mt-1">{comment.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                     ) : (
                                        <p className="text-center text-muted-foreground py-12">No comments yet.</p>
                                     )}
                                </ScrollArea>
                                <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-4 border-t">
                                    <Input
                                        placeholder="Add a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        disabled={isCommenting}
                                    />
                                    <Button type="submit" size="icon" disabled={isCommenting || !newComment.trim()}>
                                        {isCommenting ? <Loader2 className="animate-spin" /> : <Send />}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    ))
                )}
            </div>
        </div>
    );
}
