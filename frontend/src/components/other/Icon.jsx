import React from 'react';

const Icon = ({icon, color}) => {
    return (
        <i style={{color: `${color}`}} className={`fa-solid fa-${icon}`}></i>
    );
};

export default Icon;