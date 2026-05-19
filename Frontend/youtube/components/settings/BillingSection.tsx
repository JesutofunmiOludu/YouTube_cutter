import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Download, ExternalLink } from 'lucide-react';

export const BillingSection: React.FC = () => {
  const billingHistory = [
    { id: 'INV-001', date: 'Mar 1, 2026', amount: '$15.00', status: 'Paid' },
    { id: 'INV-002', date: 'Feb 1, 2026', amount: '$15.00', status: 'Paid' },
    { id: 'INV-003', date: 'Jan 1, 2026', amount: '$15.00', status: 'Paid' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-50 tracking-tight">Billing & Subscription</h2>
        <p className="text-sm text-gray-400 mt-1">Manage your active plan and payment methods.</p>
      </div>

      <Card padded className="bg-gray-800 border-gray-700 rounded-[12px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-200">VidMind Pro</h3>
            <p className="text-sm text-gray-400 mt-1">Your next billing date is April 1, 2026.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-50">$15<span className="text-sm text-gray-400 font-normal">/mo</span></span>
            <Button className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-[8px]">
              Manage Subscription
            </Button>
          </div>
        </div>
      </Card>

      <Card padded className="bg-gray-800 border-gray-700 rounded-[12px]">
        <h3 className="text-base font-medium text-gray-200 mb-4">Billing History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-900/50">
              <tr>
                <th scope="col" className="px-4 py-3 rounded-tl-lg">Date</th>
                <th scope="col" className="px-4 py-3">Amount</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 rounded-tr-lg">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((invoice, idx) => (
                <tr key={idx} className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-200">{invoice.date}</td>
                  <td className="px-4 py-3">{invoice.amount}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-[#3B82F6] hover:underline flex items-center gap-1 text-sm">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
