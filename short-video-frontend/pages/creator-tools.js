import { useState } from 'react';
import Head from 'next/head';

export default function CreatorTools() {
    const [timeRange, setTimeRange] = useState('7');

    // Dữ liệu giả định
    const staticVideos = [
        { id: 1, title: 'Video 1', views: 1500, likes: 120 },
        { id: 2, title: 'Video 2', views: 2300, likes: 180 },
        { id: 3, title: 'Video 3', views: 980, likes: 75 },
    ];

    return (
        <div className="container mx-auto p-4">
            <Head>
                <title>Công cụ nhà sáng tạo</title>
                <meta name="description" content="Thống kê nội dung cho nhà sáng tạo" />
            </Head>

            <h1 className="text-3xl font-bold mb-6 text-center">Thống kê nội dung</h1>

            <div className="mb-6 flex justify-center">
                <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium rounded-l-lg ${timeRange === '7' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-100'}`}
                        onClick={() => setTimeRange('7')}
                    >
                        7 ngày
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium ${timeRange === '15' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border-t border-b border-gray-200 hover:bg-gray-100'}`}
                        onClick={() => setTimeRange('15')}
                    >
                        15 ngày
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium rounded-r-lg ${timeRange === '30' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-100'}`}
                        onClick={() => setTimeRange('30')}
                    >
                        30 ngày
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <p className="text-lg font-medium mb-4">Khoảng thời gian: <span className="font-bold">{timeRange} ngày</span></p>

                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {staticVideos.map((video, index) => (
                            <div key={index} className="border rounded-lg p-3">
                                <p className="font-bold">{video.title || 'Không có tiêu đề'}</p>
                                <p>Lượt xem: {video.views || 0}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 