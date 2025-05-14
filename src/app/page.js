'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserCircleIcon } from '@heroicons/react/24/solid';

export default function Home() {
  const [nominees, setNominees] = useState([]);

  const fetchNominees = async () => {
    const response = await fetch('http://localhost:3000/api/');
    const data = await response.json();
    setNominees(data.data);
  };

  useEffect(() => {
    fetchNominees();
  }, []);
  
  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Voting Platform
        </h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {nominees.map((candidate) => (
            <Link
              key={candidate.id}
              href={`/vote/${candidate.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex justify-center mb-4">
                  {candidate.image ? (
                    <img
                      src={candidate.image}
                      alt={candidate.name}
                      className="h-32 w-32 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="h-32 w-32 text-gray-400" />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-center text-gray-900">
                  {candidate.name}
                </h2>
                <p className="text-center text-gray-600 mt-2">
                  {candidate.position}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
