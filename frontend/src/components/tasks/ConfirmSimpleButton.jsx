import React, {useState} from 'react';
import SimpleButton from "../SimpleButton.jsx";

const ConfirmSimpleButton = ({action,  children, ...props}) => {
    const [confirmState, setCState] = useState(false);
    const switchStater = () => {
        setCState(prev => !prev);
    }

    return (
        <>
            {!confirmState ? (
                <SimpleButton {...props} onClick={switchStater}>
                    {children}
                </SimpleButton>
            ) : (
                <div className='bfxrow aic gap5'>
                    <span>Вы уверены?</span>
                    <SimpleButton style='green' icon="check" onClick={action}></SimpleButton>
                    <SimpleButton style='red' icon='xmark' onClick={switchStater}></SimpleButton>
                </div>
            )}

        </>
    );
};

export default ConfirmSimpleButton;