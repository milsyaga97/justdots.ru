import Icon from "./other/Icon.jsx";

export const SimpleButton = ({ icon, iconColor, style, children, ...props }) => {
    const className = style ? `simple-button-${style}` : 'simple-button-white';

    return (
        <button className={className} {...props}>
            {icon && (
                <Icon icon={icon} color={iconColor}/>
            )}
            {children}
        </button>
    )
}


export default SimpleButton