import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';

const ReAllotmentSection = ({ plots, t = (s) => s, darkMode = false }) => {
    // Advanced AI Logic: Identify plots for re-allotment based on violation + unutilization
    const auditData = useMemo(() => {
        if (!plots || plots.length === 0) return null;

        // Filter and score plots for re-allotment
        const candidates = plots
            .map(p => {
                const risk = p.latestAnalysis?.finalRiskScore || 0;
                const utilization = p.latestAnalysis?.utilizationScore || 0;
                const isVacant = p.latestAnalysis?.isVacant || p.status === 'vacant';
                
                // Priority Score = (Risk * 0.4) + ((100 - utilization) * 0.6)
                // We want high risk and low utilization plots
                let priorityScore = (risk * 0.4) + ((100 - utilization) * 0.6);
                if (isVacant) priorityScore += 20; // Extra weight for vacant plots

                return {
                    id: p.plotId,
                    name: p.name || 'N/A',
                    score: Math.min(100, Math.round(priorityScore)),
                    risk,
                    utilization,
                    isVacant
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 6);

        return {
            labels: candidates.map(c => c.id),
            datasets: [
                {
                    label: 'Re-allotment Priority',
                    data: candidates.map(c => c.score),
                    backgroundColor: candidates.map(c => c.score > 70 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(245, 158, 11, 0.8)'),
                    borderRadius: 8,
                }
            ],
            raw: candidates
        };
    }, [plots]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `Priority Score: ${context.raw}%`
                }
            }
        },
        scales: {
            x: { 
                beginAtZero: true, 
                max: 100,
                grid: { color: darkMode ? '#334155' : '#e2e8f0' },
                ticks: { color: darkMode ? '#94a3b8' : '#64748b' }
            },
            y: {
                grid: { display: false },
                ticks: { color: darkMode ? '#f1f5f9' : '#1e293b', font: { weight: 'bold' } }
            }
        }
    };

    return (
        <div className="glass" style={{
            padding: '24px',
            borderRadius: '20px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: darkMode ? '#f8fafc' : '#1e293b' }}>
                        🧠 AI Optimization: Re-allotment Engine
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>
                        Identifying underutilized land using 7-factor spatial audit.
                    </p>
                </div>
                <div style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>LIVE ANALYSIS</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1 }}>
                <div style={{ height: '300px' }}>
                    {auditData ? (
                        <Bar data={auditData} options={options} />
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            Awaiting spatial data...
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                        Smart Audit Insights
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '8px' }}>
                        {auditData?.raw.map((c, i) => (
                            <div key={i} className="glass" style={{
                                padding: '12px',
                                borderRadius: '12px',
                                borderLeft: `4px solid ${c.score > 70 ? '#ef4444' : '#f59e0b'}`,
                                background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{c.id}</span>
                                    <span style={{ color: c.score > 70 ? '#ef4444' : '#f59e0b', fontSize: '0.85rem', fontWeight: 'bold' }}>{c.score}% Priority</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                                    {c.isVacant ? '🔴 Vacant for 2+ years. Immediate re-allotment suggested.' : `🟠 High violation (${c.risk}%) detected. Issue notice for under-utilization.`}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReAllotmentSection;
