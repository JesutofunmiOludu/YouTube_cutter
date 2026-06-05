import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import Textarea from '../ui/Textarea';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '../ui/Button';

export const ProfileSection: React.FC = () => {
  const [firstName, setFirstName] = useState('Alex');
  const [lastName, setLastName] = useState('Chen');
  const [email, setEmail] = useState('alex.chen@example.com');
  const [bio, setBio] = useState('Video editor and content creator. I love making cool stuff.');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-50 tracking-tight">Profile</h2>
        <p className="text-sm text-gray-400 mt-1">Manage your public profile and personal details.</p>
      </div>

      <Card padded className="bg-gray-800 border-gray-700 rounded-[12px]">
        <div className="flex flex-col gap-6">
          {/* Avatar Area */}
          <div className="flex items-center gap-6 pb-6 border-b border-gray-700">
            <Avatar src="" className="w-20 h-20 text-xl" />
            <div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-100 rounded-[8px]">
                  Upload New Avatar
                </Button>
                <Button variant="ghost" className="text-red-400 hover:bg-red-400/10 rounded-[8px]">
                  Remove
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Recommended size: 256x256px. Max 2MB.</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">First Name</label>
              <Input 
                value={firstName} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)} 
                className="bg-gray-900 border-gray-700 text-gray-50 focus:border-[#3B82F6]" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Last Name</label>
              <Input 
                value={lastName} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)} 
                className="bg-gray-900 border-gray-700 text-gray-50 focus:border-[#3B82F6]" 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Email Address</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
                className="bg-gray-900 border-gray-700 text-gray-50 focus:border-[#3B82F6]" 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Bio</label>
              <Textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                className="bg-gray-900 border-gray-700 text-gray-50 focus:border-[#3B82F6] min-h-[100px]" 
                placeholder="A short description about yourself"
              />
              <p className="text-xs text-gray-400 text-right">Max 500 characters</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
