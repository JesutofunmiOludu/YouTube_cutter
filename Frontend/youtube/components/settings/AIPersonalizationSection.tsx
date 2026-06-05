import React, { useState } from 'react';
import { Card } from '../ui/Card';
import Select from '../ui/Select'; 

export const AIPersonalizationSection: React.FC = () => {
  const [researchDepth, setResearchDepth] = useState('balanced');
  const [citationStyle, setCitationStyle] = useState('apa');

  const researchOptions = [
    { value: 'concise', label: 'Concise (Quick summaries)' },
    { value: 'balanced', label: 'Balanced (Standard details)' },
    { value: 'detailed', label: 'Detailed (In-depth analysis)' },
  ];

  const citationOptions = [
    { value: 'apa', label: 'APA Style' },
    { value: 'mla', label: 'MLA Style' },
    { value: 'ieee', label: 'IEEE Style' },
    { value: 'none', label: 'None (Plain Links)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-50 tracking-tight">AI Personalization</h2>
        <p className="text-sm text-gray-400 mt-1">Customize how the VidMind AI researches and responds.</p>
      </div>

      <Card padded className="bg-gray-800 border-gray-700 rounded-[12px] space-y-6 max-w-2xl">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">Preferred Research Depth</label>
            <Select 
              value={researchDepth} 
              onChange={(e) => setResearchDepth(e.target.value)} 
              options={researchOptions}
              className="bg-gray-900 border-gray-700 text-gray-50 focus:border-[#3B82F6]"
            />
            <p className="text-xs text-gray-400 mt-1">This setting affects automatic research reports generation.</p>
          </div>
          
          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-gray-200">Default Citation Style</label>
            <Select 
              value={citationStyle} 
              onChange={(e) => setCitationStyle(e.target.value)} 
              options={citationOptions}
              className="bg-gray-900 border-gray-700 text-gray-50 focus:border-[#3B82F6]"
            />
            <p className="text-xs text-gray-400 mt-1">Controls how external references are formatted in chat responses.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
