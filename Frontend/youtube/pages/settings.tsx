import React, { useState } from 'react';
import Head from 'next/head';
import { SettingsSidebar, SettingsTab } from '../components/settings/SettingsSidebar';
import { ProfileSection } from '../components/settings/ProfileSection';
import { SecuritySection } from '../components/settings/SecuritySection';
import { BillingSection } from '../components/settings/BillingSection';
import { AIPersonalizationSection } from '../components/settings/AIPersonalizationSection';
import { APIKeysSection } from '../components/settings/APIKeysSection';
import Button from '../components/ui/Button';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const renderSection = () => {
    switch (activeTab) {
      case 'profile': return <ProfileSection />;
      case 'security': return <SecuritySection />;
      case 'billing': return <BillingSection />;
      case 'ai': return <AIPersonalizationSection />;
      case 'api-keys': return <APIKeysSection />;
      // Also render Profile as a fallback for the remaining notifications since we grouped them
      default: return <ProfileSection />;
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] text-gray-50 font-sans selection:bg-[#3B82F6]/30">
      <Head>
        <title>Settings | VidMind AI</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <h1 className="text-2xl font-bold text-gray-50 mb-2 md:mb-6 tracking-tight">Settings</h1>
            <p className="text-sm text-gray-400 mb-6 hidden md:block">Manage your account settings, preferences, and VidMind AI features.</p>
            <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 bg-transparent">
            {renderSection()}
            
            {/* Global Action Bar */}
            <div className="mt-10 pt-6 border-t border-gray-800 flex justify-end gap-3 sticky bottom-4 bg-[#111827]/80 backdrop-blur-md z-10 py-4 round-xl">
              <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-[8px]">
                Discard
              </Button>
              <Button className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-[8px] font-medium px-6 shadow-lg shadow-blue-500/20">
                Save Changes
              </Button>
            </div>
          </main>
          
        </div>
      </div>
    </div>
  );
}
