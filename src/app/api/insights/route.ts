import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Insight from '@/models/Insight';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { product_id, event_type, platform } = body;

        // Validate input
        if (!product_id || !event_type) {
            return NextResponse.json(
                { success: false, error: 'Product ID and event type are required' },
                { status: 400 }
            );
        }

        // Validate event type
        if (!['view', 'link_click'].includes(event_type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid event type' },
                { status: 400 }
            );
        }

        // Create insight
        const insight = new Insight({
            product_id,
            event_type,
            platform
        });

        await insight.save();

        return NextResponse.json({
            success: true,
            message: 'Insight recorded successfully'
        });
    } catch (error) {
        console.error('Error recording insight:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to record insight' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const product_id = searchParams.get('product_id');
        const event_type = searchParams.get('event_type');
        const days = parseInt(searchParams.get('days') || '30');

        const query: any = {};

        // Add filters if provided
        if (product_id) query.product_id = product_id;
        if (event_type) query.event_type = event_type;

        // Add date filter
        const dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - days);
        query.created_at = { $gte: dateFilter };

        // Get insights with aggregation
        const insights = await Insight.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        product_id: '$product_id',
                        event_type: '$event_type',
                        platform: '$platform'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.product_id',
                    events: {
                        $push: {
                            type: '$_id.event_type',
                            platform: '$_id.platform',
                            count: '$count'
                        }
                    },
                    total_views: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.event_type', 'view'] }, '$count', 0]
                        }
                    },
                    total_clicks: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.event_type', 'link_click'] }, '$count', 0]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    _id: 1,
                    product_name: '$product.name',
                    events: 1,
                    total_views: 1,
                    total_clicks: 1,
                    conversion_rate: {
                        $multiply: [
                            { $divide: ['$total_clicks', { $max: ['$total_views', 1] }] },
                            100
                        ]
                    }
                }
            },
            { $sort: { total_views: -1 } }
        ]);

        return NextResponse.json({
            success: true,
            data: insights
        });
    } catch (error) {
        console.error('Error fetching insights:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch insights' },
            { status: 500 }
        );
    }
} 