import React from 'react';
import { ChevronDown } from 'lucide-react';
import domainsData from '../../../domains.json';

export const DOMAINS = domainsData?.domains ?? [];

export default function DomainSelector({ selectedDomain, onSelect }) {
  return (
    <div className="relative">
      <select
        value={selectedDomain}
        onChange={(event) => onSelect(event.target.value)}
        className="appearance-none w-full px-4 py-3 pr-10 border-4 border-black bg-white font-mono text-lg"
        disabled={DOMAINS.length === 0}
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
