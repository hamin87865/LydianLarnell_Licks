import { Link, useLocation } from "wouter";
import { Search } from "lucide-react";

interface CategoryTabsProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function CategoryTabs({ searchQuery, onSearchChange }: CategoryTabsProps) {
  const [location] = useLocation();
  const tabs = [
    { name: "드럼", path: "/drums" },
    { name: "피아노", path: "/piano" },
    { name: "베이스", path: "/bass" },
    { name: "기타", path: "/guitar" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-white/10 pb-4">
      <div className="flex flex-wrap gap-8">
        {tabs.map((tab) => (
          <Link key={tab.path} href={tab.path}>
            <a
              className={`text-xl font-bold transition-colors ${
                location === tab.path 
                  ? "text-primary border-b-2 border-primary pb-4 -mb-[18px]" 
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {tab.name}
            </a>
          </Link>
        ))}
      </div>

      {onSearchChange !== undefined && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="제목 또는 뮤지션을 작성해주세요"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-background/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary w-72 placeholder:text-gray-500/50 transition-colors"
          />
        </div>
      )}
    </div>
  );
}
