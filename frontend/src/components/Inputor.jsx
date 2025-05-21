export const Inputor = ({ size, typea, onChange, ...props }) => {
    return (
        <>
            {typea == "textarea" ? (
                <textarea className="Inputor txtarea" onChange={onChange} {...props}></textarea>
            ) : (
                <input className={size ? "Inputor iprsmall" : "Inputor"} onChange={onChange} {...props} />
            )}
        </>
    );
}
export default Inputor

// export const Form = ({ }) => {
//     const [value, setValue] = useState();
//     return (
//         <Inputor onChange={(e) => setValue(e.target.value)} />
//     );
// }