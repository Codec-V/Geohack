import React from 'react';
import { Doughnut, Pie } from 'react-chartjs-2';

const LandUsageSection = ({ plots, t = (s) => s }) => {
    // Aggregation Logic
    let utilizedArea = 0;
    let vacantArea = 0;
    let encroachedArea = 0;
    
    // Calculate total areas from analysis history
    plots.forEach(p => {
        if (p.latestAnalysis && p.latestAnalysis.usageClassification) {
            const usage = p.latestAnalysis.usageClassification;
            vacantArea += usage.vacant?.area || 0;
            encroachedArea += usage.encroached?.area || 0;
            // Utilized = Fully Constructed + Partially Constructed + any other valid use
            utilizedArea += (usage.fullyConstructed?.area || 0) + (usage.partiallyConstructed?.area || 0);
        } else {
             // Fallback if no analysis: assume vacant if status is 'vacant' or just 0
             // But usually we have some data
             vacantArea += p.approvedArea || 0; 
        }
    });

    const totalCalculated = utilizedArea + vacantArea + encroachedArea;
    // Safety to avoid division by zero
    const displayTotal = totalCalculated || 1; 

    // Chart 1: Utilized vs Misused (Vacant + Encroached)
    const misusedArea = vacantArea + encroachedArea;
    const utilizationData = {
        labels: [t('utilized_prod'), t('misused_vacant')],
        datasets: [{
            data: [utilizedArea, misusedArea],
            backgroundColor: ['#10b981', '#f43f5e'],
            borderWidth: 0,
        }]
    };

    // Chart 2: Detailed Breakdown
    const breakdownData = {
        labels: [t('constructed'), t('vacant'), t('encroached')],
        datasets: [{
            data: [utilizedArea, vacantArea, encroachedArea],
            backgroundColor: ['#3b82f6', '#fbbf24', '#ef4444'],
            borderWidth: 0,
        }]
    };

    const options = {
        plugins: {
            legend: { 
                position: 'bottom', 
                labels: { 
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 12 }
                } 
            }
        },
        maintainAspectRatio: false,
        cutout: '65%'
    };

    return (
        <div className="section-container" style={{padding: '20px', background: '#fff', borderRadius: '12px', marginTop: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
            <h2 className="section-title" style={{fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '24px'}}>{t('land_usage_title')}</h2>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px'}}>
                {/* Chart 1 */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <h3 style={{fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase'}}>{t('productive_vs_non')}</h3>
                    <div style={{height: '250px', width: '100%'}}>
                        <Doughnut data={utilizationData} options={options} />
                    </div>
                    <div style={{marginTop: '16px', textAlign: 'center'}}>
                        <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981'}}>
                            {Math.round((utilizedArea / displayTotal) * 100)}%
                        </div>
                        <div style={{fontSize: '0.875rem', color: '#64748b'}}>{t('efficiency_rate')}</div>
                    </div>
                </div>

                {/* Chart 2 */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <h3 style={{fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase'}}>{t('detailed_breakdown')}</h3>
                    <div style={{height: '250px', width: '100%'}}>
                        <Pie data={breakdownData} options={{...options, cutout: '0%'}} />
                    </div>
                    <div style={{marginTop: '16px', textAlign: 'center'}}>
                        <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444'}}>
                            {Math.round((encroachedArea / displayTotal) * 100)}%
                        </div>
                        <div style={{fontSize: '0.875rem', color: '#64748b'}}>{t('encroachment_rate')}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandUsageSection;
