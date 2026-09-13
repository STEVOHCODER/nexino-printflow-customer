import { Building2 } from 'lucide-react';
import type { Station } from '../lib/types';

interface StationHeaderProps {
  station: Station;
}

export default function StationHeader({ station }: StationHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-4">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        {station.logo_url ? (
          <img
            src={station.logo_url}
            alt={station.name}
            className="w-10 h-10 rounded-lg object-contain"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {station.name}
          </h1>
          {station.location && (
            <p className="text-sm text-gray-500 truncate">{station.location}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-green-600">Online</span>
        </div>
      </div>
    </div>
  );
}
