'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditProfileFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  initialValue: string;
  onSave: (newValue: string) => Promise<void>;
}

export const EditProfileFieldDialog: React.FC<EditProfileFieldDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  label,
  initialValue,
  onSave,
}) => {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(value);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save:", error);
      // Optionally, show a toast notification for the error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="field-value" className="text-right">
              {label}
            </Label>
            <Input
              id="field-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Annulla
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Salvataggio...' : 'Salva modifiche'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 