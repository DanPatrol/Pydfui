import { FiZap } from 'react-icons/fi';

const Homehero = () => {
  return (
    <div className="bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 xl:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-50 rounded-full text-blue-700 border border-blue-200 text-xs sm:text-sm font-medium mb-6 sm:mb-8">
            <FiZap className="mr-2" />
            Fast, Secure & Free PDF Tools
          </div>

          {/* Main heading */}
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Welcome to
            <span className="block text-blue-600">
              PDF Workshop
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Your go-to destination for managing and converting PDFs effortlessly. Whether you're looking to preview, edit, or organize your PDF files, we offer intuitive tools to simplify the process.
          </p>

          {/* CTA Buttons */}
          <div className="mt-6 sm:mt-8 md:mt-10 flex flex-col xs:flex-row flex-wrap justify-center gap-2 sm:gap-3 md:gap-4">
            <a
              href="/upload/merge"
              className="px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 min-h-[44px] min-w-[44px] bg-blue-600 text-white font-bold rounded-lg shadow-sm hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 text-center"
            >
              Merge PDFs
            </a>
            <a
              href="/upload/compress"
              className="px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 min-h-[44px] min-w-[44px] bg-white text-gray-700 font-bold rounded-lg border border-gray-300 hover:border-blue-300 transform hover:scale-105 transition-all duration-200 text-center"
            >
              Compress PDF
            </a>
            <a
              href="/upload/split"
              className="px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 min-h-[44px] min-w-[44px] bg-white text-gray-700 font-bold rounded-lg border border-gray-300 hover:border-blue-300 transform hover:scale-105 transition-all duration-200 text-center"
            >
              Split PDF
            </a>
          </div>

          {/* Quick links */}
          <div className="mt-6 sm:mt-8 text-gray-500 text-xs sm:text-sm">
            <span className="block xs:inline mr-0 xs:mr-4 mb-2 xs:mb-0">Popular tools:</span>
            <div className="flex flex-wrap justify-center gap-2 xs:gap-3">
              <a href="/upload/protect" className="hover:text-blue-600 underline">Protect</a>
              <a href="/signpdf" className="hover:text-blue-600 underline">Sign</a>
              <a href="/upload/addwatermark" className="hover:text-blue-600 underline">Watermark</a>
              <a href="/upload/rotate" className="hover:text-blue-600 underline">Rotate</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homehero;