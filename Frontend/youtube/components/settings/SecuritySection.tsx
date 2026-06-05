import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import Toggle from '../ui/Toggle';

export const SecuritySection: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-50 tracking-tight">Account Security</h2>
        <p className="text-sm text-gray-400 mt-1">Manage your password and security preferences.</p>
      </div>

      <Card padded className="bg-gray-800 border-gray-700 rounded-[12px] space-y-6">
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-200">Change Password</h3>
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Current Password</label>
              <Input 
                type="password"
                value={currentPassword} 
                onChange={(e: any) => setCurrentPassword(e.target.value)} 
                className="bg-gray-900 border-gray-700 text-gray-50 focus:border-[#3B82F6]" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">New Password</label>
              <Input 
                type="password"
                value={newPassword} 
                onChange={(e: any) => setNewPassword(e.target.value)} 
                className="bg-gray-900 border-gray-700 text-gray-50 focus:border-[#3B82F6]" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Confirm New Password</label>
              <Input 
                type="password"
                value={confirmPassword} 
                onChange={(e: any) => setConfirmPassword(e.target.value)} 
                className="bg-gray-900 border-gray-700 text-gray-50 focus:border-[#3B82F6]" 
              />
            </div>
          </div>
          <Button variant="secondary" className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-100 rounded-[8px] mt-2">
            Update Password
          </Button>
        </div>

        <hr className="border-gray-700" />

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-200">Two-factor Authentication (2FA)</h3>
            <p className="text-sm text-gray-400 mt-1">Add an extra layer of security to your account.</p>
          </div>
          <Toggle checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
        </div>
      </Card>
    </div>
  );
};
