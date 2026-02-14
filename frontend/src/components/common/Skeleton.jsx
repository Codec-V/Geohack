import React from 'react';

const Skeleton = ({ width, height, borderRadius, className = '' }) => {
    return (
        <div 
            className={`skeleton ${className}`} 
            style={{ 
                width: width || '100%', 
                height: height || '20px', 
                borderRadius: borderRadius || '4px' 
            }}
        />
    );
};

export default Skeleton;
