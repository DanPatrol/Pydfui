import React from 'react';

const MobileTestPage: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Mobile PDF Viewer Test</h1>
      
      {/* Test responsive layout */}
      <div className="flex flex-col lg:flex-row w-full min-h-screen border border-gray-300 rounded-lg overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 lg:w-3/4 border-b lg:border-b-0 lg:border-r border-gray-300 p-3 sm:p-4 lg:p-6 bg-gray-50">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">PDF Pages Grid</h2>
          
          {/* Test grid layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="relative bg-white rounded-lg shadow-md cursor-pointer transition-all duration-200 min-h-[120px] sm:min-h-[140px] md:min-h-[160px] border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg touch-target"
              >
                {/* Page number badge */}
                <div className="absolute top-1 sm:top-2 left-1 sm:left-2 z-10 px-2 sm:px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
                  {i + 1}
                </div>
                
                {/* Selection indicator */}
                <div className="absolute top-1 sm:top-2 right-1 sm:right-2 z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-green-500 opacity-0 hover:opacity-100 transition-all">
                  ✓
                </div>
                
                {/* Mock PDF content */}
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="w-8 h-10 bg-gray-300 rounded mx-auto mb-2"></div>
                    <span className="text-xs">Page {i + 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="flex-shrink-0 lg:w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-3 sm:p-4 lg:p-6 order-first lg:order-last">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 lg:mb-6 text-gray-800">
            Controls
          </h2>
          
          {/* Test buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 sm:gap-3 mb-4 sm:mb-6">
            <button className="w-full sm:w-auto lg:w-full px-3 sm:px-4 py-3 sm:py-2 lg:py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 min-h-[44px]">
              Select All
            </button>
            <button className="w-full sm:w-auto lg:w-full px-3 sm:px-4 py-3 sm:py-2 lg:py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 min-h-[44px]">
              Clear Selection
            </button>
          </div>
          
          {/* Test input */}
          <div className="mb-4 lg:mb-6 bg-white p-3 sm:p-4 lg:p-5 rounded-lg shadow-md border-2 border-gray-200">
            <label className="block text-xs sm:text-sm font-semibold mb-2 lg:mb-3 text-gray-800">
              Page Numbers
            </label>
            <input
              type="text"
              placeholder="e.g., 1,3,5 or 1-5"
              className="w-full border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all min-h-[44px]"
            />
          </div>
          
          {/* Test submit button */}
          <button className="w-full min-h-[48px] bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg shadow-lg transition-all duration-200 text-sm sm:text-base">
            Remove Pages
          </button>
        </div>
      </div>
      
      {/* Mobile breakpoint indicators */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold mb-2">Current Breakpoint:</h3>
        <div className="flex gap-2 text-sm">
          <span className="block sm:hidden px-2 py-1 bg-red-500 text-white rounded">XS (&lt;640px)</span>
          <span className="hidden sm:block md:hidden px-2 py-1 bg-orange-500 text-white rounded">SM (640px+)</span>
          <span className="hidden md:block lg:hidden px-2 py-1 bg-yellow-500 text-white rounded">MD (768px+)</span>
          <span className="hidden lg:block xl:hidden px-2 py-1 bg-green-500 text-white rounded">LG (1024px+)</span>
          <span className="hidden xl:block px-2 py-1 bg-blue-500 text-white rounded">XL (1280px+)</span>
        </div>
      </div>
    </div>
  );
};

export default MobileTestPage;