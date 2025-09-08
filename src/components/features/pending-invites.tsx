
"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { Loader2, Mail, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
  
interface Invite {
  inviteId: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  sentAt: Date;
}

interface PendingInvitesProps {
    invites: Invite[];
    isLoading: boolean;
}

export default function PendingInvites({ invites, isLoading }: PendingInvitesProps) {
    return (
        <Card className="border-0 shadow-none">
            <CardHeader className="px-0">
                <CardTitle>Pending Invites</CardTitle>
                <CardDescription>
                    These players have been invited to your team and have not yet responded.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    </div>
                ) : invites.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12 border rounded-lg">
                        <UserX className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No Pending Invites</h3>
                        <p>Use the "Scouting" tab to find and invite new players.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {invites.map((invite) => (
                            <Card key={invite.inviteId} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={invite.playerAvatar} data-ai-hint="person face"/>
                                            <AvatarFallback>{invite.playerName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">{invite.playerName}</CardTitle>
                                            <CardDescription>Invited {dayjs(invite.sentAt).fromNow()}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                  <Button variant="outline" className="w-full" disabled>
                                      <Mail className="mr-2"/>
                                      Invite Sent
                                  </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
  }
