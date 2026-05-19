import React from 'react';
import { cn } from '@/utils/cn';
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Wand2,
  Key,
} from 'lucide-react';

export type SettingsTab = 'profile' | 'security' | 'notifications' | 'billing' | 'ai' | 'api-keys';

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  className?: string;
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Account Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing & Subscription', icon: CreditCard },
  { id: 'ai', label: 'AI Personalization', icon: Wand2 },
  { id: 'api-keys', label: 'API Keys', icon: Key },
] as const;

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <nav className={cn("space-y-1 w-full md:w-64 shrink-0", className)}>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as SettingsTab)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group",
              isActive
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className={cn(
                "w-5 h-5 shrink-0",
                isActive ? "text-[#3B82F6]" : "text-gray-500 group-hover:text-gray-300"
              )}
            />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};
