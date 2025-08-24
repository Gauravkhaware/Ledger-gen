
import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import type { ChartData } from '../types';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface ChartComponentProps {
    chartData: ChartData;
    theme: 'light' | 'dark';
}

const pieColors = [
    'rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 
    'rgba(255, 206, 86, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
    'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)', 'rgba(255, 99, 255, 0.6)'
];

const pieBorderColors = pieColors.map(color => color.replace('0.6', '1'));

export const ChartComponent: React.FC<ChartComponentProps> = ({ chartData, theme }) => {
    
    const isDark = theme === 'dark';
    const textColor = isDark ? '#E0E1DD' : '#212529';
    const gridColor = isDark ? 'rgba(224, 225, 221, 0.1)' : 'rgba(33, 37, 41, 0.1)';

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: textColor,
                    font: {
                        size: 12,
                    }
                },
            },
            title: {
                display: true,
                text: chartData.title,
                color: textColor,
                font: {
                    size: 16,
                    weight: 'bold' as const,
                }
            },
            tooltip: {
                backgroundColor: isDark ? '#1B263B' : '#FFFFFF',
                titleColor: textColor,
                bodyColor: textColor,
                borderColor: gridColor,
                borderWidth: 1,
            }
        },
        scales: (chartData.type !== 'pie') ? {
            x: {
                ticks: { color: textColor },
                grid: { color: gridColor },
            },
            y: {
                ticks: { color: textColor },
                grid: { color: gridColor },
            },
        } : undefined,
    };
    
    const data = {
        labels: chartData.labels,
        datasets: chartData.datasets.map(dataset => ({
            ...dataset,
            backgroundColor: chartData.type === 'pie' ? pieColors : (isDark ? 'rgba(119, 141, 169, 0.6)' : 'rgba(0, 123, 255, 0.6)'),
            borderColor: chartData.type === 'pie' ? pieBorderColors : (isDark ? '#778DA9' : '#007BFF'),
            borderWidth: 1,
        })),
    };

    const renderChart = () => {
        switch (chartData.type) {
            case 'bar':
                return <Bar options={options} data={data} />;
            case 'line':
                return <Line options={options} data={data} />;
            case 'pie':
                return <Pie options={options} data={data} />;
            default:
                return <p>Unsupported chart type.</p>;
        }
    };

    return (
        <div style={{ height: '400px', width: '100%' }}>
            {renderChart()}
        </div>
    );
};
