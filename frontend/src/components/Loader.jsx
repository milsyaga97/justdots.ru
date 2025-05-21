export const Loader = () => {
    return (
        <div className="loader-container">
            <div className="loader-mask"></div>
            <div className="loader-container">
                <div className="ellipse ell-loader"></div>
                <div className="ellipse ell-loader"></div>
                <div className="ellipse ell-loader"></div>
                <div className="ellipse ell-loader"></div>
            </div>
        </div>
    );
}

export default Loader