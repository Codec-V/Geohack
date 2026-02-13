import React from 'react';
import { Bar } from 'react-chartjs-2';

const FinanceSection = ({ stats, t = (s) => s, darkMode = false }) => {
    if (!stats || !stats.financialStats) {
        return <div className="p-4 text-center text-gray-500">{t('loading_finance')}</div>;
    }

    const { totalDailyLoss, totalUnusedLandArea } = stats.financialStats;
    const monthlyLoss = totalDailyLoss * 30;
    const yearlyLoss = totalDailyLoss * 365;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const chartData = {
        labels: [t('daily'), t('monthly'), t('yearly_proj')],
        datasets: [
            {
                label: t('revenue_loss_chart'),
                data: [totalDailyLoss, monthlyLoss, yearlyLoss],
                backgroundColor: ['#ef4444', '#dc2626', '#991b1b'],
                borderRadius: 4,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { display: false },
                ticks: { color: darkMode ? '#94a3b8' : '#64748b' }
            },
            x: {
                grid: { display: false },
                ticks: { color: darkMode ? '#94a3b8' : '#64748b' }
            }
        },
        maintainAspectRatio: false
    };

    return (
        <div className="section-container card" style={{marginTop: '20px'}}>
            <h2 className="section-title" style={{fontSize: '1.25rem', fontWeight: '600', color: darkMode ? '#f1f5f9' : '#1e293b', marginBottom: '16px'}}>{t('finance_title')}</h2>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px'}}>
                <div style={{background: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', padding: '16px', borderRadius: '8px', border: `1px solid ${darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2'}`}}>
                    <div style={{color: '#dc2626', fontSize: '0.875rem', fontWeight: '500'}}>{t('daily_loss')}</div>
                    <div style={{color: darkMode ? '#fca5a5' : '#991b1b', fontSize: '1.5rem', fontWeight: '700'}}>{formatCurrency(totalDailyLoss)}</div>
                </div>
                <div style={{background: darkMode ? 'rgba(249, 115, 22, 0.1)' : '#fff7ed', padding: '16px', borderRadius: '8px', border: `1px solid ${darkMode ? 'rgba(249, 115, 22, 0.2)' : '#ffedd5'}`}}>
                    <div style={{color: '#ea580c', fontSize: '0.875rem', fontWeight: '500'}}>{t('monthly_proj')}</div>
                    <div style={{color: darkMode ? '#fdba74' : '#c2410c', fontSize: '1.5rem', fontWeight: '700'}}>{formatCurrency(monthlyLoss)}</div>
                </div>
                <div style={{background: darkMode ? 'rgba(13, 148, 136, 0.1)' : '#f0fdfa', padding: '16px', borderRadius: '8px', border: `1px solid ${darkMode ? 'rgba(13, 148, 136, 0.2)' : '#ccfbf1'}`}}>
                    <div style={{color: '#0f766e', fontSize: '0.875rem', fontWeight: '500'}}>{t('unused_land')}</div>
                    <div style={{color: darkMode ? '#5eead4' : '#0d9488', fontSize: '1.5rem', fontWeight: '700'}}>
                        {Math.round(totalUnusedLandArea).toLocaleString()} <span style={{fontSize: '1rem'}}>m²</span>
                    </div>
                </div>
            </div>

            <div style={{height: '300px'}}>
                <Bar data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};

export default FinanceSection;
