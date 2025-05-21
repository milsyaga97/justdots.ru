import React from 'react';

const TaskStatus = ({status}) => {
    return (
        <div className="tblbottom">
        <div className={`propblock ${status === "Закрытая" && "black"}`}>
            {status === "Закрытая" ? (
                <span style={{ color: "white", fontSize: "14px", fontWeight: 800 }}>{status}</span>
            ) : status === "В процессе" ? (
                <span style={{ color: "var(--variable-collection-black", fontSize: "14px", fontWeight: 800 }}>{status}</span>
            ) : status === "На рассмотрении модерацией" ? (
                <>
                    <div
                        style={{
                            width: "10px",
                            height: "10px",
                            background: "#4848fa"
                        }}
                        className="ellipse"
                    />
                    <span style={{ color: "#4848fa", fontSize: "14px", fontWeight: 800 }}>
                        {status}
                    </span>
                </>
            ) : status === "Открытая" ? (
                <>
                    <div
                        style={{
                            width: "10px",
                            height: "10px",
                            background: "limegreen"
                        }}
                        className="ellipse"
                    />
                    <span style={{ color: "limegreen", fontSize: "14px", fontWeight: 800 }}>
                        {status}
                    </span>
                </>
            ) : status === "Отклонена модерацией" && (
                <>
                    <span style={{ color: "red", fontSize: "14px", fontWeight: 800 }}>
                        {status}
                    </span>
                </>
            )}
        </div>
        </div>
    );
};

export default TaskStatus;