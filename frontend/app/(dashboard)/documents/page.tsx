/**
 * Document Vault — Compliance document management with upload/download.
 * Ready for backend integration when document endpoints are added.
 */
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Upload, Search, FolderOpen, Clock, Shield } from 'lucide-react';

const DOCUMENT_CATEGORIES = [
  { key: 'cdl', label: 'CDL Licenses', icon: Shield, count: 0 },
  { key: 'medical', label: 'Medical Cards', icon: FileText, count: 0 },
  { key: 'dot', label: 'DOT Inspections', icon: Clock, count: 0 },
  { key: 'insurance', label: 'Insurance Certs', icon: Shield, count: 0 },
  { key: 'permits', label: 'IRP / IFTA Permits', icon: FileText, count: 0 },
  { key: 'contracts', label: 'Carrier Contracts', icon: FolderOpen, count: 0 },
];

export default function DocumentsPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Document Vault</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Secure storage for compliance documents, certificates, and permits.
          </p>
        </div>
        <Button disabled>
          <Upload className="w-4 h-4 mr-1" /> Upload Document
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search documents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {DOCUMENT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card key={cat.key} className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-4 text-center">
                <Icon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">{cat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cat.count} files</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors">
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Drop files here or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, JPEG, PNG up to 10MB. Files are encrypted at rest.
            </p>
            <Button variant="outline" size="sm" className="mt-3" disabled>
              Browse Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No documents uploaded yet. Upload your first document to get started.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Document management backend endpoints are pending. This page will be fully functional once the backend API is ready.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
