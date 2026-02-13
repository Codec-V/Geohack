import React, { useState, useEffect } from 'react';
import { plotAPI } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PublicDashboard = ({ lang = 'en', t = (s) => s }) => {
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Comparison State
    const [comparisonList, setComparisonList] = useState([]);
    const [showComparisonModal, setShowComparisonModal] = useState(false);

    // ROI State
    const [investmentAmount, setInvestmentAmount] = useState(5000000);
    const [timeHorizon, setTimeHorizon] = useState(5);

    // Chatbot State
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { type: 'bot', text: t('chat_welcome') }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [show360, setShow360] = useState(null); // Plot object for 360 view

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await plotAPI.getAll();
            // FILTER: Show only vacant plots for public view
            const publicPlots = response.data.data.filter(p => p.status === 'vacant' || p.latestAnalysis?.isVacant);
            setPlots(publicPlots);
        } catch (error) {
            console.error('Error fetching public plots:', error);
        } finally {
            setLoading(false);
        }
    };

    // Chat Logic
    const handleSendMessage = (e) => {
        e.preventDefault();
        if(!chatInput.trim()) return;
        
        const newMessages = [...chatMessages, { type: 'user', text: chatInput }];
        setChatMessages(newMessages);
        setChatInput('');

        // Mock AI Response
        setTimeout(() => {
            let response = "I can help with that. Please contact our support office for detailed inquiry.";
            if (lang === 'hi') {
                 response = "मैं उसमें मदद कर सकता हूँ। कृपया विस्तृत जानकारी के लिए हमारे कार्यालय से संपर्क करें।";
            }

            if(chatInput.toLowerCase().includes('price') || chatInput.toLowerCase().includes('cost') || chatInput.includes('मूल्य')) 
                response = lang === 'en' ? "Industrial land prices in this area range from ₹4,200 to ₹5,500 per sqft." : "इस क्षेत्र में औद्योगिक भूमि की कीमतें ₹4,200 से ₹5,500 प्रति वर्ग फुट हैं।";
            
            if(chatInput.toLowerCase().includes('zone') || chatInput.toLowerCase().includes('industry') || chatInput.includes('उद्योग')) 
                response = lang === 'en' ? "This sector is zoned for Light to Medium Industries (textiles, electronics, assembly)." : "यह क्षेत्र हल्के से मध्यम उद्योगों (कपड़ा, इलेक्ट्रॉनिक्स, असेंबली) के लिए निर्धारित है।";
            
            setChatMessages(prev => [...prev, { type: 'bot', text: response }]);
        }, 1000);
    };

    // Comparison Logic
    const toggleComparison = (plot) => {
        if (comparisonList.find(p => p._id === plot._id)) {
            setComparisonList(comparisonList.filter(p => p._id !== plot._id));
        } else {
            if (comparisonList.length >= 3) {
                alert("You can compare up to 3 plots at a time.");
                return;
            }
            setComparisonList([...comparisonList, plot]);
        }
    };

    // ROI Calculation
    const projectedValue = investmentAmount * Math.pow(1.12, timeHorizon); // 12% CAGR

    // Simulated Price Trend Data
    const priceTrendData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Avg Land Price (₹/sqft)',
                data: [4200, 4350, 4400, 4600, 4750, 4900],
                borderColor: 'rgb(16, 185, 129)', // Emerald-500
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                tension: 0.3
            }
        ]
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Finding available land...</div>;

    return (
        <div className="dashboard-content animate-fade-in" style={{padding: '24px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px'}}>
            
            {/* Hero Section */}
            <div className="no-print" style={{textAlign: 'center', marginBottom: '40px', padding: '40px 0', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '16px'}}>
                <h1 style={{fontSize: '2.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px'}}>
                    {t('hero_title')}
                </h1>
                <p style={{fontSize: '1.25rem', color: '#64748b', maxWidth: '600px', margin: '0 auto'}}>
                    {t('hero_subtitle')}
                </p>
                <button onClick={() => window.print()} style={{marginTop: '20px', padding: '8px 16px', borderRadius: '6px', border: '1px solid #94a3b8', background: 'white', cursor: 'pointer'}}>
                    📄 {t('download_brochure')}
                </button>
            </div>

            <style>
                {`
                    @media print {
                        .no-print, .role-switcher, .app-header, .plot-card-public button, .dashboard-content > div:last-child {
                            display: none !important;
                        }
                        .dashboard-content {
                            padding: 0 !important;
                        }
                        .plot-card-public {
                            break-inside: avoid;
                            border: 1px solid #ccc !important;
                            box-shadow: none !important;
                            margin-bottom: 20px;
                        }
                    }
                `}
            </style>

            <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px'}}>
                
                {/* Left Column: Listings */}
                <div>
                    <h2 style={{fontSize: '1.5rem', fontWeight: '700', color: '#334155', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span>📍</span> {t('avail_plots')} ({plots.length})
                    </h2>
                    
                    <div style={{display: 'grid', gap: '20px'}}>
                        {plots.map(plot => {
                            const isSelected = comparisonList.find(p => p._id === plot._id);
                            return (
                                <div key={plot._id} className="plot-card-public" style={{
                                    background: isSelected ? '#f0fdf4' : 'white',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    border: isSelected ? '2px solid #16a34a' : '1px solid #f1f5f9',
                                    position: 'relative',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{position: 'absolute', top: '20px', right: '20px'}}>
                                        <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0'}}>
                                            <input 
                                                type="checkbox" 
                                                checked={!!isSelected} 
                                                onChange={() => toggleComparison(plot)}
                                            />
                                            <span style={{fontSize: '0.8rem', fontWeight: '600', color: '#64748b'}}>{t('compare_btn')}</span>
                                        </label>
                                    </div>

                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                                        <div>
                                            <h3 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px'}}>
                                                {t('plot_card_title')} {plot.plotId}
                                            </h3>
                                            <p style={{color: '#64748b', fontSize: '0.9rem'}}>{t('ind_area_phase_2')}</p>
                                        </div>
                                    </div>

                                    {/* Image Carousel Mock */}
                                    <div style={{marginTop: '12px', marginBottom: '12px', overflowX: 'auto', display: 'flex', gap: '8px', paddingBottom: '4px'}}>
                                         <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200&h=120&fit=crop" style={{borderRadius: '8px', height: '80px', width: '120px', objectFit: 'cover'}} alt="Land 1" />
                                         <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=120&fit=crop" style={{borderRadius: '8px', height: '80px', width: '120px', objectFit: 'cover'}} alt="Land 2" />
                                         <img src="https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?w=200&h=120&fit=crop" style={{borderRadius: '8px', height: '80px', width: '120px', objectFit: 'cover'}} alt="Land 3" />
                                    </div>
                                    
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px'}}>
                                        <div>
                                            <div style={{fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{t('area_size')}</div>
                                            <div style={{fontSize: '1.1rem', fontWeight: '600', color: '#334155'}}>
                                                {plot.approvedArea?.toLocaleString()} sqft
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{t('base_price')}</div>
                                            <div style={{fontSize: '1.1rem', fontWeight: '600', color: '#334155'}}>
                                                ₹{(plot.approvedArea * (plot.marketValuePerSqMeter || 5000)).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <div style={{display: 'flex', gap: '12px'}}>
                                            <span title="Road Access" style={{fontSize: '1.2rem'}}>🛣️</span>
                                            <span title="Water Supply" style={{fontSize: '1.2rem'}}>💧</span>
                                            <span title="Electricity" style={{fontSize: '1.2rem'}}>⚡</span>
                                        </div>
                                        <div style={{display: 'flex', gap: '8px'}}>
                                            <button 
                                                onClick={() => setShow360(plot)}
                                                style={{
                                                    background: 'white',
                                                    color: '#3b82f6',
                                                    border: '1px solid #3b82f6',
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem'
                                                }}>
                                                🔄 {t('view_360')}
                                            </button>
                                            <button style={{
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                fontWeight: '500',
                                                cursor: 'pointer'
                                            }}>
                                                {t('apply_btn')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Key Tools */}
                <div>
                    {/* ROI Calculator Widget */}
                    <div style={{background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '32px', border: '1px solid #e2e8f0'}}>
                        <h3 style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#166534', marginBottom: '16px'}}>{t('roi_title')}</h3>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px'}}>{t('inv_amount')} (₹)</label>
                            <input 
                                type="number" 
                                value={investmentAmount} 
                                onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                                style={{width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db'}}
                            />
                        </div>
                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px'}}>{t('time_horizon')}: <strong>{timeHorizon} Years</strong></label>
                            <input 
                                type="range" min="1" max="20" 
                                value={timeHorizon} 
                                onChange={(e) => setTimeHorizon(Number(e.target.value))}
                                style={{width: '100%'}}
                            />
                        </div>
                        <div style={{background: '#f0fdf4', padding: '16px', borderRadius: '8px', textAlign: 'center'}}>
                            <div style={{fontSize: '0.8rem', color: '#166534'}}>{t('proj_value')} (@ 12% CAGR)</div>
                            <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#15803d'}}>
                                ₹{Math.round(projectedValue).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Price Trend Chart */}
                    <div style={{background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '32px'}}>
                        <h3 style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px'}}>{t('price_trend')}</h3>
                        <div style={{height: '200px'}}>
                            <Line data={priceTrendData} options={{ maintainAspectRatio: false }} />
                        </div>
                        <p style={{fontSize: '0.9rem', color: '#64748b', marginTop: '12px'}}>
                            {t('market_trend_desc')}
                        </p>
                    </div>

                    {/* Upcoming Updates */}
                    <div style={{background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}>
                        <h3 style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px'}}>{t('infra_updates')}</h3>
                        <ul style={{listStyle: 'none', padding: 0}}>
                            <li style={{marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9'}}>
                                <div style={{fontSize: '0.8rem', color: '#3b82f6', fontWeight: '600', marginBottom: '4px'}}>{t('new_tag')} • Feb 2026</div>
                                <div style={{fontWeight: '500', color: '#334155'}}>{t('update_1')}</div>
                            </li>
                             <li>
                                <div style={{fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '4px'}}>DEC 2025</div>
                                <div style={{fontWeight: '500', color: '#334155'}}>{t('update_2')}</div>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>

            {/* Chatbot Widget */}
            <div style={{position: 'fixed', bottom: '24px', right: '24px', zIndex: 100}}>
                {!showChat && (
                    <button 
                        onClick={() => setShowChat(true)}
                        style={{
                            background: '#3b82f6', color: 'white', width: '60px', height: '60px', 
                            borderRadius: '50%', border: 'none', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)',
                            fontSize: '2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        💬
                    </button>
                )}
                {showChat && (
                    <div style={{
                        width: '320px', height: '400px', background: 'white', borderRadius: '16px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
                        overflow: 'hidden', border: '1px solid #e2e8f0'
                    }}>
                        <div style={{background: '#3b82f6', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <h3 style={{margin: 0, fontSize: '1rem'}}>{t('chat_title')}</h3>
                            <button onClick={() => setShowChat(false)} style={{background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer'}}>✕</button>
                        </div>
                        <div style={{flex: 1, padding: '16px', overflowY: 'auto', background: '#f8fafc'}}>
                            {chatMessages.map((msg, i) => (
                                <div key={i} style={{marginBottom: '12px', textAlign: msg.type === 'user' ? 'right' : 'left'}}>
                                    <div style={{
                                        display: 'inline-block', padding: '8px 12px', borderRadius: '12px',
                                        background: msg.type === 'user' ? '#3b82f6' : 'white',
                                        color: msg.type === 'user' ? 'white' : '#334155',
                                        border: msg.type === 'bot' ? '1px solid #e2e8f0' : 'none',
                                        maxWidth: '80%'
                                    }}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} style={{padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px'}}>
                            <input 
                                type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                                placeholder={t('chat_placeholder')} 
                                style={{flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db'}}
                            />
                            <button type="submit" style={{background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '0 12px', cursor: 'pointer'}}>➤</button>
                        </form>
                    </div>
                )}
            </div>

            {/* Comparison Bar & Modal */}
            {comparisonList.length > 0 && (
                <div style={{
                    position: 'fixed', bottom: '0', left: '0', width: '100%', 
                    background: 'white', padding: '16px', borderTop: '1px solid #e2e8f0', 
                    boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', zIndex: 90
                }}>
                    <span style={{fontWeight: '600', color: '#334155'}}>{comparisonList.length} {t('compare_selected')}</span>
                    <button 
                        onClick={() => setShowComparisonModal(true)}
                        style={{background: '#16a34a', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'}}
                    >
                        {t('compare_btn')}
                    </button>
                    <button 
                         onClick={() => setComparisonList([])}
                         style={{background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'}}
                    >
                        {t('clear')}
                    </button>
                </div>
            )}

            {/* Comparison Modal */}
            {showComparisonModal && (
                <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setShowComparisonModal(false)}>
                    <div style={{background: 'white', padding: '32px', borderRadius: '16px', maxWidth: '800px', width: '90%', maxHeight: '80vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
                        <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px'}}>{t('plot_comparison')}</h2>
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                            <thead>
                                <tr>
                                    <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b'}}>{t('attribute')}</th>
                                    {comparisonList.map(plot => (
                                        <th key={plot._id} style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>
                                            {t('plot_card_title')} {plot.plotId}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{padding: '12px', borderBottom: '1px solid #f1f5f9', fontWeight: '600', color: '#334155'}}>{t('area_sqft')}</td>
                                    {comparisonList.map(plot => (
                                        <td key={plot._id} style={{padding: '12px', borderBottom: '1px solid #f1f5f9'}}>
                                            {plot.approvedArea?.toLocaleString()}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td style={{padding: '12px', borderBottom: '1px solid #f1f5f9', fontWeight: '600', color: '#334155'}}>{t('price_est')}</td>
                                    {comparisonList.map(plot => (
                                        <td key={plot._id} style={{padding: '12px', borderBottom: '1px solid #f1f5f9', color: '#16a34a', fontWeight: 'bold'}}>
                                            ₹{(plot.approvedArea * (plot.marketValuePerSqMeter || 5000)).toLocaleString()}
                                        </td>
                                    ))}
                                </tr>
                                 <tr>
                                    <td style={{padding: '12px', borderBottom: '1px solid #f1f5f9', fontWeight: '600', color: '#334155'}}>{t('status')}</td>
                                    {comparisonList.map(plot => (
                                        <td key={plot._id} style={{padding: '12px', borderBottom: '1px solid #f1f5f9'}}>
                                            {plot.status === 'vacant' ? t('comp_vacant') : t('comp_available')}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td style={{padding: '12px', borderBottom: '1px solid #f1f5f9', fontWeight: '600', color: '#334155'}}>{t('utilities')}</td>
                                    {comparisonList.map(plot => (
                                        <td key={plot._id} style={{padding: '12px', borderBottom: '1px solid #f1f5f9'}}>
                                            {t('comp_utils')}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                        <div style={{marginTop: '24px', textAlign: 'right'}}>
                            <button onClick={() => setShowComparisonModal(false)} style={{background: '#334155', color: 'white', padding: '10px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer'}}>{t('close')}</button>
                        </div>
                    </div>
                </div>
            )}
            {/* 360 View Modal */}
            {show360 && (
                <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setShow360(null)}>
                    <div style={{background: 'white', padding: '16px', borderRadius: '16px', width: '90%', height: '80vh', display: 'flex', flexDirection: 'column'}} onClick={e => e.stopPropagation()}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
                            <h2 style={{fontSize: '1.5rem', margin: 0}}>🔄 {t('view_360')} - {t('plot_card_title')} {show360.plotId}</h2>
                            <button onClick={() => setShow360(null)} style={{fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer'}}>✕</button>
                        </div>
                        <div style={{flex: 1, background: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative'}}>
                            <iframe 
                                width="100%" 
                                height="100%" 
                                allowFullScreen 
                                style={{borderStyle: 'none'}} 
                                src="https://pannellum.org/pannellum.htm#panorama=https://pannellum.org/images/alma.jpg&autoLoad=true">
                            </iframe>
                            <div style={{position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '8px', borderRadius: '4px'}}>
                                {t('simulated_view')}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default PublicDashboard;
