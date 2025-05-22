import { useEffect, useState, useContext } from "react";
import { AuthContext } from '../../context/AuthContext.jsx';
import api from '../../services/api.jsx';
import { CalcMinusDater } from '../../utils/CalcMinusDater.jsx';
import { Link, useNavigate } from "react-router-dom";
import { SimpleButton } from "../SimpleButton.jsx";
import { useNotification } from '../../context/Notifications.jsx';
import {getAppCounter} from "../../utils/AppCounter.jsx";
import TaskStatus from "./TaskStatus.jsx";
import TaskBudjet from "./TaskBudjet.jsx";
import Icon from "../other/Icon.jsx";

export const Task = ({ task, trigger }) => {
    const navigate = useNavigate();
    const { myuser } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [taskOwner, setTaskOwner] = useState({});
    const [taskFreelancer, setTaskFreelancer] = useState({});
    const [appcounter, setApps] = useState(0);
    const [err, setErr] = useState (null);
    const notify = useNotification();

    useEffect(() => {
        const handleTaskFetch = async () => {
            if (!task) return;
            try {
                if (task.owner_id) {
                    const ownerResponse = await api.get(`/users/profile/${task.owner_id}`);
                    setTaskOwner(ownerResponse.data);
                }

                if (task.freelancer_id && task.freelancer_id !== myuser.id) {
                    const freelancerResponse = await api.get(`/users/profile/${task.freelancer_id}`);
                    setTaskFreelancer(freelancerResponse.data);
                }

                if(!task.freelancer_id && myuser.id == task.owner_id){
                    const count = await getAppCounter(task.id);
                    setApps(count);
                }
            } catch (error) {
                setErr(error);
                console.error('Ошибка при загрузке данных:', error);
                notify({ message: "Ошибка при загрузке данных", type: "error", duration: 4200 });
            } finally {
                setLoading(false);
            }
        };
        handleTaskFetch();
    }, [task, trigger]);


    const handleTaskDelete = async () => {
        try {
            await api.delete(`/tasks/${task.id}`);
            setIsDeleting(true);
            notify({ message: `Заказ #${task.id} удален`, type: "info", duration: 4200 });
        }
        catch (error) {
            console.log(error);
            setIsDeleting(false);
            notify({ message: `Ошибка при удалении заказа: ${error.message || "NuN"}`, type: "error", duration: 4200 });
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

    const { diffresult, dayText, status } = CalcMinusDater(task.deadline);

    return (
        <div style={task.status == "Закрытая" || task.status == "Отклонена модерацией" ? { opacity: 0.5 } : { opacity: 1 }} className={isDeleting ? "bodyblock fxrow deleting" : "bodyblock fxrow"}>
            <Link style={{textDecoration: "none", color: "var(--variable-collection-black)"}} to={'/task/' + task.id}>
            <div className="taskblock">
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
                        {task.status == "Открытая" || task.status == "В процессе" ? (
                            <div className={status ? "propblock black" : "propblock red"}>
                                {diffresult} {dayText}
                            </div>
                        ) : null}
                    </div>
                    <TaskBudjet bmin={task.budget_min} bmax={task.budget_max} view="min"/>
                    <TaskStatus status={task.status}/>
                </div>
            </div>
            </Link>
            <div className="taskblock">
                {myuser.id === taskOwner.id && task.status !== "На рассмотрении модерацией" ? (
                    <div className="tbtop">
                        {task.status === "Открытая" || task.status === "Отклонена модерацией" ? (
                            <SimpleButton
                                style="red"
                                icon="trash"
                                onClick={handleTaskDelete}
                                disabled={isDeleting}
                            >
                                Удалить заказ
                            </SimpleButton>
                        ) : (
                            <>
                                {task.status !== "Закрытая" ? "Работает фрилансер" : "Заказ выполнил"}
                                <Link
                                    style={{ textDecoration: "none", color: "var(--variable-collection-accent)" }}
                                    to={`/profile/${taskFreelancer.id}`}
                                >
                                    <div className="task-freelancerlink">
                                        <b>{taskFreelancer.username}</b>
                                    </div>
                                </Link>
                            </>
                        )}
                    </div>
                ) : task.status !== "На рассмотрении модерацией" ? (
                    <div className="tbtop">
                        <Link className={"bfxrow gap5"} style={{textDecoration: "none"}} to={'/profile/' + taskOwner.id}>
                            <div className="propblock">{taskOwner?.username}</div>
                            <div className="propblock black">
                                <Icon icon="star" color="gold"/>
                                {taskOwner.profile?.rating || "0.0"}
                            </div>
                        </Link>
                    </div>
                ) : task.status === "На рассмотрении модерацией" && (
                    <div className="tbtop">
                        <SimpleButton
                        style="red"
                        icon="trash"
                        onClick={handleTaskDelete}
                        disabled={isDeleting}
                        >
                            Удалить заказ
                        </SimpleButton>
                    </div>
                    )}
                <div className="tbbottom">
                    {task.status == "Открытая" && myuser.user_type == "customer" ? (
                        <SimpleButton
                            style={appcounter > 0 ? "white butcounter" : "white"}
                            data-count={appcounter}
                            onClick={() => navigate(`/task/${task.id}`)}
                            icon='users'
                        >
                            Заявки
                        </SimpleButton>
                    ) : null}
                    <SimpleButton
                        icon="search"
                        iconColor="var(--variable-collection-black)"
                        onClick={() => navigate(`/task/${task.id}`)}
                    >
                        Посмотреть заказ
                    </SimpleButton>
                </div>
            </div>
        </div >
    )
}

export default Task