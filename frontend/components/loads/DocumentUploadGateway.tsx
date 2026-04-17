'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UploadCloud, Edit3, Loader2 } from 'lucide-react';
import type { ParsedLoadData } from '@/components/loads/CreateLoadDialog';
import api from '@/lib/api';
import { extractApiError } from '@/lib/errors';

interface DocumentUploadGatewayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onParseSuccess: (data: ParsedLoadData) => void;
  onManualEntry: () => void;
}

export default function DocumentUploadGateway({
  open,
  onOpenChange,
  onParseSuccess,
  onManualEntry,
}: DocumentUploadGatewayProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/loads/parse-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = response.data;
      onParseSuccess(data);
      onOpenChange(false);
    } catch (err: unknown) {
      setError(extractApiError(err, 'Failed to parse document. Please try again.'));
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!isUploading) onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-md bg-background/60 backdrop-blur-xl border-white/10 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">Add New Load</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            How would you like to add this load?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 items-center justify-center border-dashed border-2 hover:bg-primary/5 hover:border-primary/50 transition-all rounded-xl"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="font-medium text-sm">Analyzing document with AI...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-6 h-6 text-primary" />
                <span className="font-medium">Upload Rate Con / BOL (Auto-fill)</span>
                <span className="text-xs text-muted-foreground font-normal">PDF only</span>
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="secondary"
            className="h-16 flex items-center justify-center gap-2 rounded-xl"
            onClick={() => {
              onManualEntry();
              onOpenChange(false);
            }}
            disabled={isUploading}
          >
            <Edit3 className="w-5 h-5" />
            <span className="font-medium">Enter Manually</span>
          </Button>

          {error && (
            <p className="text-sm text-destructive text-center mt-2 bg-destructive/10 p-2 rounded-lg">
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
