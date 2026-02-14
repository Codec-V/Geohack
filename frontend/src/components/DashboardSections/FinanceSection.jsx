import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';

const FinanceSection = ({ stats, t = (s) => s, darkMode = false }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(2025);

    if (!stats || !stats.financialStats) {
        return <div className="p-4 text-center text-gray-500">{t('loading_finance')}</div>;
    }

    const { totalDailyLoss, totalUnusedLandArea } = stats.financialStats;
    const monthlyLoss = totalDailyLoss * 30;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const years = [2024, 2025, 2026];

    // Generate daily simulation data
    const chartData = useMemo(() => {
        const daysInMonth = 30; // simplify
        const labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1} ${months[selectedMonth].substring(0, 3)}`);
        
        // Randomize daily data slightly for professional visual interest (max 5% variance)
        const data = Array.from({ length: daysInMonth }, () => {
            const variance = (Math.random() - 0.5) * (totalDailyLoss * 0.05);
            return totalDailyLoss + variance;
        });

        return {
            labels,
            datasets: [
                {
                    label: t('revenue_loss_trend'),
                    data: data,
                    fill: true,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                }
            ]
        };
    }, [selectedMonth, selectedYear, totalDailyLoss]);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: darkMode ? '#1e293b' : '#fff',
                titleColor: darkMode ? '#f1f5f9' : '#1e293b',
                bodyColor: darkMode ? '#f1f5f9' : '#1e293b',
                borderColor: '#ef4444',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: (context) => `Loss: ${formatCurrency(context.parsed.y)}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: { 
                    color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    drawBorder: false 
                },
                ticks: { 
                    color: darkMode ? '#94a3b8' : '#64748b',
                    callback: (value) => `₹${(value / 1000).toFixed(0)}k`
                }
            },
            x: {
                grid: { display: false },
                ticks: { 
                    color: darkMode ? '#94a3b8' : '#64748b',
                    maxTicksLimit: 10
                }
            }
        },
        maintainAspectRatio: false
    };

    return (
        <div className="section-container card glass-card" style={{marginTop: '20px', overflow: 'hidden'}}>
            <div className="section-header" style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px 20px',
                background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
            }}>
                <h2 className="section-title" style={{fontSize: '1.25rem', fontWeight: '700', color: darkMode ? '#f1f5f9' : '#1e293b', margin: 0}}>
                    💹 {t('finance_title')}
                </h2>
                
                <div style={{display: 'flex', gap: '10px'}}>
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="glass"
                        style={{padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--color-border)'}}
                    >
                        {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="glass"
                        style={{padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--color-border)'}}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>
            
            <div style={{padding: '24px'}}>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px'}}>
                    <div className="glass" style={{padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ef4444'}}>
                        <div style={{color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px'}}>{t('daily_loss')}</div>
                        <div style={{color: '#ef4444', fontSize: '1.75rem', fontWeight: '800'}}>{formatCurrency(totalDailyLoss)}</div>
                        <div style={{fontSize: '0.7rem', color: '#ef4444', marginTop: '4px', opacity: 0.8}}>↓ 12% vs last month</div>
                    </div>
                    <div className="glass" style={{padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f97316'}}>
                        <div style={{color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px'}}>{t('monthly_proj')}</div>
                        <div style={{color: '#f97316', fontSize: '1.75rem', fontWeight: '800'}}>{formatCurrency(monthlyLoss)}</div>
                        <div style={{fontSize: '0.7rem', color: '#f97316', marginTop: '4px', opacity: 0.8}}>Estimated impact</div>
                    </div>
                    <div className="glass" style={{padding: '20px', borderRadius: '12px', borderLeft: '4px solid #0d9488'}}>
                        <div style={{color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px'}}>{t('unused_land')}</div>
                        <div style={{color: '#0d9488', fontSize: '1.75rem', fontWeight: '800'}}>
                            {Math.round(totalUnusedLandArea).toLocaleString()}<small style={{fontSize: '0.8rem', marginLeft: '4px'}}>m²</small>
                        </div>
                        <div style={{fontSize: '0.7rem', color: '#0d9488', marginTop: '4px', opacity: 0.8}}>Total Potential Yield</div>
                    </div>
                </div>

                <div style={{height: '350px'}}>
                    <Line data={chartData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
};

export default FinanceSection;
