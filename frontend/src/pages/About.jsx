import React from 'react';

export default function About() {
  return (
    <div className="min-h-screen bg-[#06101E] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">
            About Omstream
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-yellow-500 to-transparent mx-auto rounded-full"></div>
        </div>

        <div className="bg-[#0B1F3A]/40 backdrop-blur rounded-2xl border border-yellow-500/20 p-8 md:p-12 text-gray-300 leading-relaxed space-y-6 shadow-2xl">
          <p className="text-xl text-yellow-100 font-light mb-8">
            Omstream is a digital sanctuary dedicated to presenting the timeless teachings of the Bhagavad Gita in an accessible, beautiful, and profound way.
          </p>
          
          <div className="space-y-4">
            <h2 className="text-2xl text-yellow-500 font-serif font-bold">Our Mission</h2>
            <p>
              To bring the ancient wisdom of Lord Krishna out of the confines of history and into the practical daily lives of modern seekers. We aim to present these teachings not merely as religious texts, but as universal science of consciousness and actionable life management systems.
            </p>
          </div>

          <div className="space-y-4 mt-8">
            <h2 className="text-2xl text-yellow-500 font-serif font-bold">Features Built For You</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li><strong className="text-gray-200">Daily Sloka:</strong> Start your day with profound inspiration.</li>
              <li><strong className="text-gray-200">Chapter Stories:</strong> Understand the context and deep meaning behind each chapter.</li>
              <li><strong className="text-gray-200">Video Discourses:</strong> Learn from the detailed explanations by realized souls.</li>
              <li><strong className="text-gray-200">Bilingual Support:</strong> Experience the truth in both English and Telugu.</li>
            </ul>
          </div>
          
          <div className="mt-12 pt-8 border-t border-yellow-500/20 text-center">
            <p className="italic text-gray-400">"Whenever there is a decline in righteousness and an increase in unrighteousness, O Arjuna, at that time I manifest myself on earth."</p>
            <p className="mt-2 text-yellow-600 font-bold">— Lord Krishna (Bhagavad Gita 4.7)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
