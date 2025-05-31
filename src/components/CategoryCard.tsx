import Link from 'next/link';
import { Package } from 'lucide-react';

interface CategoryCardProps {
  category: {
    _id: string;
    name: string;
    description: string;
    no_of_items: number;
  };
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/categories/${category._id}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300 cursor-pointer border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {category.no_of_items} items
          </span>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {category.name}
        </h3>
        
        <p className="text-gray-600 text-sm line-clamp-3">
          {category.description}
        </p>
        
        <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
          <span>Explore products</span>
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
} 