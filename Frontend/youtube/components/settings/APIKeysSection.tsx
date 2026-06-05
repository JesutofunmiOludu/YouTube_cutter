import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Copy, Trash2, KeyRound } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  createdAt: string;
}

export const APIKeysSection: React.FC = () => {
  const [keys] = useState<ApiKey[]>([
    {
      id: 'key-1',
      name: 'Production Environment',
      maskedKey: 'vm_live_********************a8f2',
      createdAt: 'Mar 15, 2026',
    },
    {
      id: 'key-2',
      name: 'Development Testing',
      maskedKey: 'vm_test_********************b9k1',
      createdAt: 'Mar 25, 2026',
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-50 tracking-tight">API Keys</h2>
          <p className="text-sm text-gray-400 mt-1">Manage API keys for VidMind integrations.</p>
        </div>
        <Button className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-[8px] flex items-center justify-center gap-2">
          <KeyRound className="w-4 h-4" />
          Generate New Key
        </Button>
      </div>

      <Card padded className="bg-gray-800 border-gray-700 rounded-[12px]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-900/50">
              <tr>
                <th scope="col" className="px-4 py-3 rounded-tl-lg">Name</th>
                <th scope="col" className="px-4 py-3">Secret Key</th>
                <th scope="col" className="px-4 py-3">Created</th>
                <th scope="col" className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-200">{key.name}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-gray-300 bg-gray-900 px-2 py-1 rounded-md text-xs border border-gray-700">
                      {key.maskedKey}
                    </span>
                  </td>
                  <td className="px-4 py-3">{key.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md">
                        <Copy className="w-4 h-4" />
                        <span className="sr-only">Copy key</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md">
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete key</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-400 mb-1">Important Note</h4>
        <p className="text-xs text-blue-200/70 leading-relaxed">
          Your secret API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.
        </p>
      </div>
    </div>
  );
};
