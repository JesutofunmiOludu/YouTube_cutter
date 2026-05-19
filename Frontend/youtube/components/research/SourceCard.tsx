import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import type { SourceType } from '../../types';

export interface SourceCardProps {
  title: string;
  url: string;
  sourceType: SourceType;
  excerpt?: string | null;
  relevanceRank: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({
  title,
  url,
  sourceType,
  excerpt,
  relevanceRank,
}) => {
  return (
    <Card className="mb-4 hover:border-primary-400 transition-colors">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2 items-center">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[color:var(--color-info-50)] text-[color:var(--color-info-text)] text-caption font-medium font-mono">
              {relevanceRank}
            </div>
            <Badge variant="info" className="capitalize px-2 h-6 flex items-center">{sourceType}</Badge>
          </div>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[color:var(--color-text-tertiary)] hover:text-primary-600 transition-colors focus-ring rounded-sm"
            title="Open Source"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        
        <h4 className="text-heading-sm text-[color:var(--color-text-primary)] m-0 mb-2 leading-tight pr-8">
          {title}
        </h4>
        
        {excerpt && (
          <p className="text-body-sm text-[color:var(--color-text-secondary)] border-l-2 border-[color:var(--color-border-tertiary)] pl-3 italic m-0">
            "{excerpt}"
          </p>
        )}
        
        <div className="mt-3 truncate">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-caption text-primary-600 hover:underline">
            {url}
          </a>
        </div>
      </div>
    </Card>
  );
};
