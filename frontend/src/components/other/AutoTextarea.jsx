import { useRef, useEffect } from 'react';

const AutoResizeTextarea = () => {
    const textareaRef = useRef(null);

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
        const textarea = textareaRef.current;
        textarea?.addEventListener('input', adjustHeight);
        return () => textarea?.removeEventListener('input', adjustHeight);
    }, []);

    return { textareaRef, adjustHeight };
};

export const AutoTextarea = ({fSize, children }) => {
    const { textareaRef } = AutoResizeTextarea();
    let textSize = '16px';

    if(fSize) {textSize = fSize};

    return (
        <textarea
            ref={textareaRef}
            placeholder=""
            value={children}
            className='taskblock-desc'
            rows={1}
            style={{
                resize: 'none',
                overflow: 'hidden',
                minHeight: '5px',
                fontSize: `${textSize}`,
                background: '#00000000',
                color: `var(--variable-collection-black)`
            }}
            disabled
        />
    );
};

export default AutoTextarea;