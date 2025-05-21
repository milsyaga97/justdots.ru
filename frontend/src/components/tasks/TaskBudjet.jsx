import React from 'react';
import Icon from "../other/Icon.jsx";

const TaskBudjet = ({bmin, bmax, view}) => {
    return (
        <div className={view == "min" ? "taskblock-price" : "propblock taskblock-price"}>
        {bmax !== bmin ? (
            <>
                {bmin} - {bmax}
                <Icon icon="ruble-sign"></Icon>
                <span style={{ fontSize: 17 + "px", paddingTop: 5 + "px" }}>за заказ</span>
            </>
        ) : (
            <>
                {bmax}
                <Icon icon="ruble-sign"></Icon>
                <span style={{ fontSize: 17 + "px", paddingTop: 5 + "px" }}>за заказ</span>
            </>
        )}
        </div>
    );
};

export default TaskBudjet;