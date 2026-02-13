import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DevelopmentSection = ({ plots, t = (s) => s, darkMode = false }) => {
    // Simulate historical data for "Development Speed"
    
    // Generate last 6 months labels
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(d.toLocaleString('default', { month: 'short' }));
    }

    // Simulated Growth Data (Cumulative Built-up Area in sqft)
    const baseArea = 500000; 
    const growthRate = [1.0, 1.05, 1.12, 1.18, 1.25, 1.35]; 
    
    const dataPoints = growthRate.map(rate => Math.round(baseArea * rate));

    const data = {
        labels: months,
        datasets: [
            {
                label: t('total_dev_area'),
                data: dataPoints,
                fill: true,
                backgroundColor: darkMode ? 'rgba(13, 148, 136, 0.1)' : 'rgba(13, 148, 136, 0.2)',
                borderColor: '#0d9488', 
                tension: 0.4, 
                pointBackgroundColor: '#0d9488',
                pointBorderColor: darkMode ? '#0f172a' : '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#0d9488'
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
                    boxWidth: 8,
                    color: darkMode ? '#f1f5f9' : '#1e293b'
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                titleColor: darkMode ? '#f1f5f9' : '#1e293b',
                bodyColor: darkMode ? '#94a3b8' : '#475569',
                borderColor: darkMode ? '#334155' : '#e2e8f0',
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
                    color: darkMode ? '#334155' : '#f1f5f9',
                    borderDash: [5, 5]
                },
                ticks: {
                    color: darkMode ? '#94a3b8' : '#64748b',
                    callback: (value) => `${value / 1000}k`
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: darkMode ? '#94a3b8' : '#64748b'
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
        <div className="section-container card" style={{marginTop: '20px'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                <div>
                    <h2 className="section-title" style={{fontSize: '1.25rem', fontWeight: '600', color: darkMode ? '#f1f5f9' : '#1e293b'}}>{t('dev_growth_title')}</h2>
                    <p style={{fontSize: '0.875rem', color: '#64748b'}}>{t('dev_tracking_desc')}</p>
                </div>
                <div style={{padding: '6px 12px', background: darkMode ? 'rgba(20, 184, 166, 0.1)' : '#f0fdfa', color: darkMode ? '#2dd4bf' : '#0f766e', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600'}}>
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
