export default function handler(req, res) {
    const { days = '7' } = req.query;

    // Giả lập dữ liệu để kiểm tra
    const mockVideos = [
        { id: 1, title: 'Video 1', views: 1500, likes: 120 },
        { id: 2, title: 'Video 2', views: 2300, likes: 180 },
        { id: 3, title: 'Video 3', views: 980, likes: 75 },
    ];

    // Mô phỏng delay của API thực tế
    setTimeout(() => {
        res.status(200).json({
            success: true,
            timeRange: days,
            videos: mockVideos
        });
    }, 500);
} 