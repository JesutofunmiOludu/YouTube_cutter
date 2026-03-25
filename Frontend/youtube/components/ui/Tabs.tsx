import React, { HTMLAttributes } from 'react';

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`w-full ${className}`} {...props}>
      {children}
    </div>
  )
);
Tabs.displayName = 'Tabs';

export const TabsList = React.forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`flex space-x-1 border-b border-gray-700 p-1 ${className}`} {...props} />
  )
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className = '', active, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:pointer-events-none disabled:opacity-50 ${
        active
          ? 'bg-gray-800 text-gray-50 shadow-sm border border-gray-700'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
      } ${className}`}
      {...props}
    />
  )
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className = '', active, ...props }, ref) => {
    if (!active) return null;
    return (
      <div
        ref={ref}
        className={`mt-4 ring-offset-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 w-full ${className}`}
        {...props}
      />
    );
  }
);
TabsContent.displayName = 'TabsContent';
