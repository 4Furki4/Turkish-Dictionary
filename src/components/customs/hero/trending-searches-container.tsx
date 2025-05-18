"use client";

import React from 'react';
import TrendingSearches from './trending-searches';

export default function TrendingSearchesContainer() {
  return (
    <div className="space-y-6">
      <TrendingSearches period="7days" />
      <TrendingSearches period="30days" />
    </div>
  );
}
