import LittleLogo from "../assets/justdots_littlelogo.svg?react";
import DefaultLogo from "../assets/justdots_logo.svg?react";
import SimpleButton from "./SimpleButton";

export const LogoContainer = ({ size }) => {
    const LogoComponent = size === "little" ? LittleLogo : DefaultLogo;

    return (
        <div className="logo-container">
            <LogoComponent fill="var(--variable-collection-black)" />
        </div>
    );
};

export default LogoContainer;