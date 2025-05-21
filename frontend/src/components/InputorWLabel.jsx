import Inputor from "./Inputor";

export const InputorWLabel = ({ label, ...props }) => {
    return (
        <div className="InputorBlock">
            <label className="iblabel">
                {label}
            </label>
            <Inputor  {...props} />
        </div>
    );
}

export default InputorWLabel;