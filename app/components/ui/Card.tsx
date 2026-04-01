// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { cn } from '@/lib/utils';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('bg-white border border-gray-200 rounded-xl shadow-sm', className)}>{children}</div>;
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-5 py-4 border-b border-gray-100 flex items-center gap-3', className)}>{children}</div>;
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-5 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl', className)}>{children}</div>;
}
