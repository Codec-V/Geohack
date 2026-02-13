import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DevelopmentSection = ({ plots, t = (s) => s }) => {
    // Simulate historical data for "Development Speed"
    // In a real app, this would come from `analysisHistory` aggregated by date
    
    // Generate last 6 months labels
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(d.toLocaleString('default', { month: 'short' }));
    }

    // Simulated Growth Data (Cumulative Built-up Area in sqft)
    // Starting base
    const baseArea = 500000; 
    const growthRate = [1.0, 1.05, 1.12, 1.18, 1.25, 1.35]; // Simuluated growth curve
    
    const dataPoints = growthRate.map(rate => Math.round(baseArea * rate));

    const data = {
        labels: months,
        datasets: [
            {
                label: t('total_dev_area'),
                data: dataPoints,
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue-500 with opacity
                borderColor: 'rgb(59, 130, 246)', // Blue-500
                tension: 0.4, // Smooth curve
                pointBackgroundColor: 'rgb(59, 130, 246)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(59, 130, 246)'
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1e293b',
                bodyColor: '#475569',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                callbacks: {
                    label: (context) => ` ${context.parsed.y.toLocaleString()} sq ft`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: {
                    color: '#f1f5f9',
                    borderDash: [5, 5]
                },
                ticks: {
                    callback: (value) => `${value / 1000}k`
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        },
        maintainAspectRatio: false
    };

    return (
        <div className="section-container" style={{padding: '20px', background: '#fff', borderRadius: '12px', marginTop: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                <div>
                    <h2 className="section-title" style={{fontSize: '1.25rem', fontWeight: '600', color: '#1e293b'}}>{t('dev_growth_title')}</h2>
                    <p style={{fontSize: '0.875rem', color: '#64748b'}}>{t('dev_tracking_desc')}</p>
                </div>
                <div style={{padding: '6px 12px', background: '#ecfdf5', color: '#059669', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600'}}>
                    +12.5% {t('growth_month')}
                </div>
            </div>

            <div style={{height: '350px', width: '100%'}}>
                <Line data={data} options={options} />
            </div>
        </div>
    );
};

export default DevelopmentSection;
