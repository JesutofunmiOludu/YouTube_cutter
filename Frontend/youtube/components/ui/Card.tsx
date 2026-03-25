import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-6 py-4 border-b border-gray-700 ${className}`} {...props} />
);

export const CardTitle = ({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-lg font-semibold text-gray-50 leading-none tracking-tight ${className}`} {...props} />
);

export const CardContent = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 ${className}`} {...props} />
);

export const CardFooter = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-6 py-4 flex items-center ${className}`} {...props} />
);
