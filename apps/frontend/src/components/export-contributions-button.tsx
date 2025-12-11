'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

interface ExportContributionsButtonProps {
  campaignId: string;
  authToken: string;
}

export function ExportContributionsButton({ campaignId, authToken }: ExportContributionsButtonProps) {
  const [exporting, setExporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setShowMenu(false);
    setExporting(true);
    setError(null);

    try {
      // Use the same base URL as GraphQL endpoint (backend server)
      const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3030/graphql';
      const baseUrl = graphqlUrl.replace('/graphql', '');
      const url = new URL(`${baseUrl}/campaigns/export`);
      url.searchParams.set('campaignId', campaignId);
      url.searchParams.set('format', format);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Export failed';
        setError(errorMessage);
        setTimeout(() => setError(null), 5000);
        return;
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `contributions-${campaignId}.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Export failed';
      setError(message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        disabled={exporting}
        className="gap-2"
        onClick={() => setShowMenu(!showMenu)}
      >
        {exporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Export
      </Button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover p-1 shadow-md z-50">
          <button
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={() => handleExport('csv')}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export as CSV
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={() => handleExport('pdf')}
          >
            <FileText className="h-4 w-4" />
            Export as PDF
          </button>
        </div>
      )}

      {error && (
        <div className="absolute top-full mt-2 right-0 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-700 whitespace-nowrap z-50">
          {error}
        </div>
      )}
    </div>
  );
}
