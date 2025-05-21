import React from 'react';
import ReactComponent from '../assets/background.svg?react';

const Background = ({style, children}) => {
    return (
        <div className={style}>
            <ReactComponent>{children}</ReactComponent>
        </div>
    );
};

export default Background;