import React from 'react';
import { ChevronDown } from 'lucide-react';

export const DOMAINS = [
  'botlynk.indevs.in',
  'botlynk-01.indevs.in',
  'botlynk-02.indevs.in',
  'botlynk-03.indevs.in',
  'botlynk-04.indevs.in',
];

export default function DomainSelector({ selectedDomain, onSelect }) {
  return (
    <div className="relative">
      <select
        value={selectedDomain}
        onChange={(event) => onSelect(event.target.value)}
        className="appearance-none w-full px-4 py-3 pr-10 border-4 border-black bg-white font-mono text-lg"
      >
        {DOMAINS.map((domain) => (
          <option key={domain} value={domain}>
            @{domain}
          </option>
        ))}
      </select>
      <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2" />
    </div>
  );
}
