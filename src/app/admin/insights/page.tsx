'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, MousePointer, TrendingUp, Calendar, ExternalLink } from 'lucide-react';
import AdminNav from '@/components/AdminNav';
import Link from 'next/link';

interface InsightData {
    _id: string;
    product_name: string;
    events: Array<{
        type: 'view' | 'link_click';
        platform?: string;
        count: number;
    }>;
    total_views: number;
    total_clicks: number;
    conversion_rate: number;
}

export default function InsightsPage() {
    const router = useRouter();
    const [insights, setInsights] = useState<InsightData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState(30);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (process.env.NEXT_PUBLIC_ADMIN_ENABLED !== 'true') {
            router.push('/');
            return;
        }
        setIsAuthorized(true);
        fetchInsights();
    }, [days, router]);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/insights?days=${days}`);
            const data = await response.json();

            if (data.success) {
                setInsights(data.data);
            } else {
                setError(data.error || 'Failed to fetch insights');
            }
        } catch (error) {
            setError('Failed to load insights');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthorized) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <AdminNav />
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading insights...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <AdminNav />
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
                        <p className="text-gray-600 mb-6">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const totalViews = insights.reduce((sum, item) => sum + item.total_views, 0);
    const totalClicks = insights.reduce((sum, item) => sum + item.total_clicks, 0);
    const averageConversionRate = (insights.reduce((sum, item) => sum + item.conversion_rate, 0) / Math.max(insights.length, 1)).toFixed(1);

    // Get top performing platforms
    const platformStats = insights.reduce((acc, product) => {
        product.events
            .filter(e => e.type === 'link_click' && e.platform)
            .forEach(event => {
                const platform = event.platform!;
                if (!acc[platform]) acc[platform] = 0;
                acc[platform] += event.count;
            });
        return acc;
    }, {} as { [key: string]: number });

    const topPlatforms = Object.entries(platformStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminNav />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Product Insights</h1>

                    <div className="flex items-center space-x-4">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                        </select>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Views</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {totalViews.toLocaleString()}
                                </p>
                            </div>
                            <Eye className="h-8 w-8 text-purple-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Clicks</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {totalClicks.toLocaleString()}
                                </p>
                            </div>
                            <MousePointer className="h-8 w-8 text-purple-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Average Conversion Rate</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {averageConversionRate}%
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Top Platforms */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Top Performing Platforms</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {topPlatforms.map(([platform, clicks]) => (
                                <div key={platform} className="bg-purple-50 rounded-lg p-4">
                                    <div className="font-medium text-purple-900">{platform}</div>
                                    <div className="text-sm text-purple-600">{clicks} clicks</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Product Performance</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Views
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Clicks
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Conversion Rate
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Top Platform
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {insights.map((item) => {
                                    const topPlatform = item.events
                                        .filter(e => e.type === 'link_click' && e.platform)
                                        .sort((a, b) => b.count - a.count)[0];

                                    return (
                                        <tr key={item._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={`/products/${item._id}`}
                                                    className="text-sm font-medium text-purple-600 hover:text-purple-900"
                                                >
                                                    {item.product_name}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{item.total_views.toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{item.total_clicks.toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{item.conversion_rate.toFixed(1)}%</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {topPlatform ? (
                                                        <>
                                                            {topPlatform.platform}
                                                            <span className="ml-2 text-gray-500">
                                                                ({topPlatform.count} clicks)
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400">No clicks</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-3">
                                                    <Link
                                                        href={`/admin/upload?edit=${item._id}`}
                                                        className="text-purple-600 hover:text-purple-900"
                                                        title="Edit Product"
                                                    >
                                                        <ExternalLink className="h-5 w-5" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
} 