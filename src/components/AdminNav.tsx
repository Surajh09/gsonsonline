import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Upload, BarChart2, Tag } from 'lucide-react';

export default function AdminNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="bg-white shadow mb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-8 h-16">
                    <Link
                        href="/admin/upload"
                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/admin/upload')
                            ? 'border-purple-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }`}
                    >
                        <Upload className="h-5 w-5 mr-2" />
                        Upload
                    </Link>

                    <Link
                        href="/admin/insights"
                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/admin/insights')
                            ? 'border-purple-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }`}
                    >
                        <BarChart2 className="h-5 w-5 mr-2" />
                        Insights
                    </Link>

                    <Link
                        href="/admin/categories"
                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/admin/categories')
                            ? 'border-purple-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }`}
                    >
                        <Tag className="h-5 w-5 mr-2" />
                        Categories
                    </Link>
                </div>
            </div>
        </div>
    );
} 