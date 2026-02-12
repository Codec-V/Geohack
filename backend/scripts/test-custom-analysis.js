import axios from 'axios';

async function testCustomAnalysis() {
    console.log('🧪 Testing Custom Analysis Endpoint...');

    const mockGeometry = {
        type: 'Polygon',
        coordinates: [[
            [77.2090, 28.6139],
            [77.2100, 28.6139],
            [77.2100, 28.6149],
            [77.2090, 28.6149],
            [77.2090, 28.6139]
        ]]
    };

    try {
        const response = await axios.post('http://localhost:5000/api/plots/analyze-custom', {
            geometry: mockGeometry
        });

        if (response.data.success) {
            console.log('✅ Custom Analysis Successful!');
            const plot = response.data.data;
            console.log('Plot ID:', plot.plotId);
            console.log('Area:', plot.approvedArea);
            console.log('Analysis Result:', JSON.stringify(plot.latestAnalysis.usageClassification, null, 2));
        } else {
            console.error('❌ Analysis Failed:', response.data.error);
        }
    } catch (error) {
        console.error('❌ Request Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testCustomAnalysis();
