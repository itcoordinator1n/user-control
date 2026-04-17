"use client";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-72 bg-gray-200 rounded" />
            <div className="h-4 w-52 bg-gray-200 rounded" />
          </div>
          <div className="h-10 w-36 bg-gray-200 rounded" />
        </div>

        {/* Filters row */}
        <div className="flex gap-4">
          <div className="h-10 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-48 bg-gray-200 rounded" />
          <div className="h-10 flex-1 max-w-md bg-gray-200 rounded" />
        </div>

        {/* Area cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-lg" />
          ))}
        </div>

        {/* Main table area */}
        <div className="h-80 bg-gray-200 rounded-lg" />

        {/* Pagination */}
        <div className="flex justify-between items-center">
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 w-9 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
