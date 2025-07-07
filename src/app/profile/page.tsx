'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Users, Mail, Copy, Edit, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';
import { EditProfileFieldDialog } from '@/components/profile/EditProfileFieldDialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell } from 'lucide-react';

// Funzione per recuperare i dati dell'utente
const fetchUserData = async () => {
  const res = await fetch('/api/users/me');
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchUserData,
  });

  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isEditCoupleOpen, setIsEditCoupleOpen] = useState(false);

  const updateUserMutation = useMutation({
    mutationFn: (data: { name?: string; notificationsEnabled?: boolean }) =>
      fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userData'] });
      toast({ title: "Successo", description: "Le tue impostazioni sono state aggiornate." });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile aggiornare le impostazioni.", variant: "destructive" });
    },
  });

  const updateCoupleMutation = useMutation({
    mutationFn: (newName: string) =>
      fetch('/api/couples/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userData'] });
      toast({ title: "Successo", description: "Il nome della coppia è stato aggiornato." });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile aggiornare il nome della coppia.", variant: "destructive" });
    },
  });


  const handleCopyInviteCode = () => {
    if (user?.couple?.inviteCode) {
      navigator.clipboard.writeText(user.couple.inviteCode);
      toast({
        title: "Copiato!",
        description: "Il codice invito è stato copiato negli appunti.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex items-center space-x-4 mb-8">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-64" />
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Errore</h1>
        <p>Impossibile caricare i dati del profilo. Riprova più tardi.</p>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-10">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
            <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Il Tuo Profilo</span>
                <Button variant="ghost" size="icon" onClick={() => setIsEditUserOpen(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>Gestisci le tue informazioni personali.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{user.name}</span>
              </div>
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
            </CardContent>
          </Card>

          {/* Couple Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>La Vostra Coppia</span>
                 <Button variant="ghost" size="icon" onClick={() => setIsEditCoupleOpen(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>Informazioni e impostazioni condivise.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{user.couple?.name || 'La nostra storia'}</span>
              </div>
              <div className="flex items-center justify-between">
                  <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">Codice Invito:</span>
                      <span className="font-mono bg-muted px-2 py-1 rounded">{user.couple?.inviteCode}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleCopyInviteCode}>
                      <Copy className="h-4 w-4" />
                  </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 mt-8">
            <Card>
              <CardHeader>
                  <CardTitle>Impostazioni</CardTitle>
                  <CardDescription>Gestisci le preferenze dell'applicazione.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="notifications-switch" className="flex items-center">
                          <Bell className="mr-2 h-4 w-4"/>
                          Notifiche Push
                      </Label>
                      <Switch
                          id="notifications-switch"
                          checked={user.notificationsEnabled}
                          onCheckedChange={(checked) => 
                              updateUserMutation.mutate({ notificationsEnabled: checked })
                          }
                      />
                  </div>
              </CardContent>
            </Card>
        </div>

        <div className="mt-12 flex justify-center">
            <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/' })}>
                <LogOut className="mr-2 h-4 w-4" />
                Esci
            </Button>
        </div>
      </div>

      {/* Edit User Dialog */}
      <EditProfileFieldDialog
        open={isEditUserOpen}
        onOpenChange={setIsEditUserOpen}
        title="Modifica Nome Utente"
        description="Aggiorna il tuo nome visualizzato."
        label="Nome"
        initialValue={user.name || ''}
        onSave={async (newName) => updateUserMutation.mutate({ name: newName })}
      />

      {/* Edit Couple Dialog */}
      {user.couple && (
        <EditProfileFieldDialog
          open={isEditCoupleOpen}
          onOpenChange={setIsEditCoupleOpen}
          title="Modifica Nome Coppia"
          description="Aggiorna il nome della vostra coppia."
          label="Nome Coppia"
          initialValue={user.couple.name || ''}
          onSave={async (newName) => updateCoupleMutation.mutate(newName)}
        />
      )}
    </>
  );
};

export default ProfilePage; 