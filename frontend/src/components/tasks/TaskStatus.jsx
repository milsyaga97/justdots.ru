import React from 'react';
import Icon from "../other/Icon.jsx";

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
            ) : status === "На проверке заказчиком" ? (
                <>
                    <span style={{ color: "var(--variable-collection-accent)", fontSize: "14px", fontWeight: 800 }}>
                        <Icon icon='eye'></Icon> {status}
                    </span>
                </>
            ) : status === "Спор" ? (
                <>
                    <span style={{ color: "orange", fontSize: "20px", fontWeight: 800 }}>
                         <Icon icon="warning"></Icon> {status}
                    </span>
                </>
            ) : status === "Отклонена модерацией" && (
                <>
                    <span style={{ color: "red", fontSize: "14px", fontWeight: 800 }}>
                        <Icon icon='xmark'></Icon> {status}
                    </span>
                </>
            )}
        </div>
        </div>
    );
};

export default TaskStatus;