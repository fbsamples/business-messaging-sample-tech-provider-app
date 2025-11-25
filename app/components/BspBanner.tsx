'use client';

// import { useState, useEffect } from 'react';

export default function BspBanner({ children }: { children: React.ReactNode }) {

    const banner = (
        <div className="mt-3 mb-3 border-dotted rounded-lg border px-5 py-4 border-gray-400 bg-gray-100 text-xs">
            {children}
        </div>
    );

    return (
        <>
            {banner}
        </>
    );
}
