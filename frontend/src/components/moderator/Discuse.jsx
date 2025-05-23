import React, { useEffect, useState} from 'react';
import {Link, useNavigate} from "react-router-dom";
import {useNotification} from "../../context/Notifications.jsx";
import api from "../../services/api.jsx";
import {CalcMinusDater} from "../../utils/CalcMinusDater.jsx";
import {SERVER_URL} from "../../pathconfig.js";
import AutoTextarea from "../other/AutoTextarea.jsx";
import SimpleButton from "../SimpleButton.jsx";
import TaskBudjet from "../tasks/TaskBudjet.jsx";
import TaskStatus from "../tasks/TaskStatus.jsx";
import Icon from "../other/Icon.jsx";

const Discuse = ({task}) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [taskOwner, setTaskOwner] = useState({});
    const [err, setErr] = useState (null);
    const notify = useNotification();
    const [isDeleting, Delete] = useState(false);

    const Accept = async () => {
        try{
            if(isDeleting) return;
            api.post(`/tasks/${task.id}/moderate/approve`);
            notify({message: `Заказ #${task.id} принят`, type: "info", duration: 4200});
        }
        catch(error){
            console.log(error);
            notify({message: `Произошла ошибка при принятии заказа #${task.id}`, type: "error", duration: 4200});
        }
        finally{
            Delete(true);
        }
    }

    const Decline = async () => {
        try{
            if(isDeleting) return;
            api.post(`/tasks/${task.id}/moderate/reject`);
            notify({message: `Заказ #${task.id} отклонен`, type: "info", duration: 4200});
        }
        catch(error){
            console.log(error);
            notify({message: `Произошла ошибка при отклонении заказа #${task.id}`, type: "error", duration: 4200});
        }
        finally{
            Delete(true);
        }
    }



    if (loading) {
        return (
            <div style={{ fontSize: 40 + "px" }} className="bodyblock nlbb"></div>
        )
    }

    if(err){
        return (
            <div style={{ fontSize: 40 + "px" }} className="bodyblock nlbb"></div>
        )
    }

    const { diffresult, dayText } = CalcMinusDater(task.deadline);

    return (
        <div className={isDeleting ? "bodyblock fxrow deleting" : "bodyblock fxrow"}>
            <div className="taskblock" onClick={() => navigate(`/task/${task.id}`)}>
                <div className="taskblock-title">
                    {task.title}
                </div>
                <div className="taskblock-info">
                    <div className="taskblock-infoprops">
                        <div className="propblock accent">
                            {task.category}
                        </div>
                        <div className="propblock">
                            {task.skill_level}
                        </div>
                        <div className={"propblock black"}>
                            {diffresult} {dayText}
                        </div>
                    </div>
                    <TaskBudjet bmin={task.budget_min} bmax={task.budget_max} view={"max"}/>
                    <TaskStatus status={task.status} />
                </div>
            </div>
            <div className="taskblock">
                <div className="tbtop">
                    <div className="task-freelancerlinkfull">
                        <div className="bfxcol gap5">
                            <div className='bfxrow aic gap5 rev'>
                                <span style={{color: "var(--variable-collection-black)"}}>Заказчик</span>
                                <Link style={{ textDecoration: "none" }} to={`/profile/${task.owner_profile.user_id}`}>
                                    <div className="miniprofile">
                                        <div className="miniprofile-avatar">
                                            {task.owner_profile.avatar_url ? (
                                                <img src={`${SERVER_URL}${task.owner_profile.avatar_url}`} alt="Аватар заказчика" />
                                            ) : (<div/>)}
                                        </div>
                                        <div className="propblock black">
                                            <Icon icon="star" color="gold"/>
                                            {task.owner_profile.rating || "0.0"}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                            <div className='bfxrow aic gap5 rev'>
                                <span style={{color: "var(--variable-collection-black)"}}>Исполнитель</span>
                                <Link style={{ textDecoration: "none" }} to={`/profile/${task.freelancer_profile.user_id}`}>
                                    <div className="miniprofile">
                                        {task.freelancer_profile.username}
                                        <div className="miniprofile-avatar">
                                            {task.freelancer_profile.avatar_url ? (
                                                <img src={`${SERVER_URL}${task.freelancer_profile.avatar_url}`} alt="Аватар заказчика" />
                                            ) : (<div/>)}
                                        </div>
                                        <div className="propblock black">
                                            <Icon icon="star" color="gold"/>
                                            {task.freelancer_profile.rating || "0.0"}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="tbbottom">
                    <SimpleButton icon='search' onClick={() => navigate(`/task/${task.id}`)}>
                        Посмотреть заказ
                    </SimpleButton>
                </div>
            </div>
        </div >
    )
};

export default Discuse;