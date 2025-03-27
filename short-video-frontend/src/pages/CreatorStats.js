import React, { useState, useEffect, useContext } from 'react';
import { useQuery } from '@apollo/client';
import { GET_DAILY_VIDEO_STATISTICS } from '../GraphQLQueries/userQueries';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { format, subDays } from 'date-fns';
import { Button, Container, Row, Col, Card, Table, Spinner } from 'react-bootstrap';
import UserContext from '../contexts/userContext';
// Đăng ký các thành phần Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const CreatorStats = () => {
    const [timeRange, setTimeRange] = useState(7); // Mặc định là 7 ngày
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const { user } = useContext(UserContext);

    // Cập nhật khoảng thời gian khi người dùng thay đổi lựa chọn
    useEffect(() => {
        const end = new Date();
        const start = subDays(end, timeRange);
        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(end, 'yyyy-MM-dd'));
    }, [timeRange]);

    // Lấy dữ liệu thống kê từ server
    const { loading, error, data } = useQuery(GET_DAILY_VIDEO_STATISTICS, {
        variables: {
            startDate,
            endDate
        },
        fetchPolicy: 'network-only'
    });

    // Tính tổng số lượt xem, likes, comments
    const calculateTotals = () => {
        if (!data?.getDailyVideoStatistics) return { totalViews: 0, totalLikes: 0, totalComments: 0 };
        console.log('data: ' + data.getDailyVideoStatistics[0].comments)
        return data.getDailyVideoStatistics.reduce((acc, day) => {
            return {
                totalViews: acc.totalViews + day.views,
                totalLikes: acc.totalLikes + day.likes,
                totalComments: acc.totalComments + day.comments
            };
        }, { totalViews: 0, totalLikes: 0, totalComments: 0 });
    };

    const { totalViews, totalLikes, totalComments } = calculateTotals();

    // Chuẩn bị dữ liệu cho biểu đồ
    const chartData = {
        labels: data?.getDailyVideoStatistics?.map(day => day.date) || [],
        datasets: [
            {
                label: 'Lượt xem',
                data: data?.getDailyVideoStatistics?.map(day => day.views) || [],
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
            {
                label: 'Lượt thích',
                data: data?.getDailyVideoStatistics?.map(day => day.likes) || [],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'Bình luận',
                data: data?.getDailyVideoStatistics?.map(day => day.comments) || [],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Số liệu thống kê nội dung',
            },
        },
    };

    if (!user) {
        return <Container className="py-5"><h3>Vui lòng đăng nhập để xem thống kê</h3></Container>;
    }

    return (
        <Container className="py-4">
            <h2 className="mb-4">Thống kê nội dung của bạn</h2>

            <div className="mb-4">
                <Button
                    variant={timeRange === 7 ? "primary" : "outline-primary"}
                    className="me-2"
                    onClick={() => setTimeRange(7)}
                >
                    7 ngày qua
                </Button>
                <Button
                    variant={timeRange === 14 ? "primary" : "outline-primary"}
                    className="me-2"
                    onClick={() => setTimeRange(14)}
                >
                    14 ngày qua
                </Button>
                <Button
                    variant={timeRange === 30 ? "primary" : "outline-primary"}
                    onClick={() => setTimeRange(30)}
                >
                    30 ngày qua
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </Spinner>
                </div>
            ) : error ? (
                <div className="alert alert-danger">
                    Có lỗi xảy ra: {error.message}
                </div>
            ) : (
                <>
                    <Row className="mb-4">
                        <Col md={4}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h3>{totalViews}</h3>
                                    <Card.Text>Tổng lượt xem</Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h3>{totalLikes}</h3>
                                    <Card.Text>Tổng lượt thích</Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="text-center">
                                <Card.Body>
                                    <h3>{totalComments}</h3>
                                    <Card.Text>Tổng bình luận</Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <div className="mb-4">
                        <Line options={chartOptions} data={chartData} />
                    </div>

                    <h4 className="mb-3">Dữ liệu chi tiết</h4>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Lượt xem</th>
                                <th>Lượt thích</th>
                                <th>Bình luận</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.getDailyVideoStatistics?.length ? (
                                data.getDailyVideoStatistics.map((day, index) => (
                                    <tr key={index}>
                                        <td>{day.date}</td>
                                        <td>{day.views}</td>
                                        <td>{day.likes}</td>
                                        <td>{day.comments}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center">Không có dữ liệu</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </>
            )}
        </Container>
    );
};

export default CreatorStats; 