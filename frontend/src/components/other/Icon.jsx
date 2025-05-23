import React from 'react';

const Icon = ({icon, color, size}) => {
    return (
        <i style={{color: `${color}`, fontSize: (size || 16)}} className={`fa-solid fa-${icon}`}></i>
    );
};

export default Icon;