import { useParams } from "react-router-dom";
import React, { useEffect, useState, useContext } from "react";
import { useNotification } from '../../context/Notifications.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import api from '../../services/api.jsx';
import { CalcMinusDater } from '../../utils/CalcMinusDater.jsx';
import { AutoTextarea } from "../other/AutoTextarea.jsx";
import { SimpleButton } from "../SimpleButton.jsx";
import { Link, useNavigate } from "react-router-dom";
import { SERVER_URL } from "../../pathconfig.js";
import Loader from '../Loader.jsx';
import FeedbacksViewer from "../customer/FeedbacksViewer.jsx";
import {getAppCounter} from "../../utils/AppCounter.jsx";
import TaskBudjet from "./TaskBudjet.jsx";
import TaskStatus from "./TaskStatus.jsx";
import MakeReview from "./MakeReview.jsx";
import Icon from "../other/Icon.jsx";
import ReviewViewer from "./ReviewViewer.jsx";
import Inputor from "../Inputor.jsx";
import Message from "../chat/message.jsx";
import MessageViewer from "./MessageViewer.jsx";
import ConfirmSimpleButton from "./ConfirmSimpleButton.jsx";
import message from "../chat/message.jsx";

export const TaskViewer = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { myuser } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState({});
    const notify = useNotification();
    const [taskOwner, setTaskOwner] = useState({});
    const [taskFreelancer, setTaskFreelancer] = useState({});
    const [appcounter, setApps] = useState(0);
    const [isConfirmed, setConfirm] = useState(false);
    const [swSend, setSWSend] = useState(false);

    const [matchedApp, setMatchedApp] = useState({});
    const [isApped, setApp] = useState(false);
    const [appText, setAppText] = useState("");
    const [appPrice, setAppPrice] = useState(null);

    const [isUpdate, setUpdate] = useState(false);

    const [arbitrageState, setArbState] = useState(false);
    const switchArbBut = () => {
        setArbState(prev => !prev);
    }
    const arbitrageMaker = async () => {
        try{
            api.post(`/tasks/${task.id}/open-dispute`);
            notify({message: `Вы открыли спор по заказу #${task.id}`, type: 'warning', duration: 4200});
        }
        catch(error){
            console.log(error);
        }
        finally {
            update();
        }
    }

    const handleTaskFetch = async () => {
        if (!myuser) return;
        try {
            const taskResponse = await api.get(`/tasks/${id}`);
            setTask(taskResponse.data);

            if (taskResponse.data.owner_id) {
                const ownerResponse = await api.get(`/users/profile/${taskResponse.data.owner_id}`);
                setTaskOwner(ownerResponse.data);
            }

            if (taskResponse.data.freelancer_id) {
                const freelancerResponse = await api.get(`/users/profile/${taskResponse.data.freelancer_id}`);
                setTaskFreelancer(freelancerResponse.data);
            }

            if(!task.freelancer_id && myuser.user_type !== "customer"){
                const count = await getAppCounter(task.id);
                setApps(count);
            }
        } catch (error) {
            {error.code == "ERR_BAD_REQUEST" && navigate("/login")};
            console.error('Ошибка при загрузке данных:', error);
            notify({ message: "Заказ закрыт", type: "info", duration: 4200 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleTaskFetch();
    }, [id, isConfirmed, isUpdate]);


    useEffect(() => {
        const fetchAppsAndCheck = async () => {
            if(myuser === "customer" || !task) return;
            try{
                const response = await api.get('/tasks/applications');
                const found = response.data.some(app => app.task_id === task.id);
                const match = response.data.find(app => app.task_id === task.id);
                setMatchedApp(match);
                setApp(found);
                console.log(found);
            }
            catch(error){
                console.error(error);
            }
        }

        fetchAppsAndCheck();
    }, [task, myuser, isUpdate])


    const handleTaskDelete = async () => {
        try {
            await api.delete(`/tasks/${task.id}`);
            notify({ message: `Заказ #${task.id} удален`, type: "info", duration: 4200 });
        }
        catch (error) {
            console.log(error);
            notify({ message: `Ошибка при удалении заказа: ${error.message || "NuN"}`, type: "error", duration: 4200 });
        }
        finally {
            navigate("/mytasks")
        }
    }

    const handleSendApp = async () => {
        if(isApped) return (notify({message: "Вы уже оставили заявку на данный заказ", type: "info", duration: 4200}));
        if(appText.length < 5) return (notify({message: "Длина сообщения должна быть больше пяти символов", type: "info", duration: 4200}));
        if(appPrice < 100) return (notify({message: "Предлагаемая цена должна быть больше 100", type: "info", duration: 4200}));

        const nowdate = new Date().toISOString();
        try {
            await api.post(`/tasks/${task.id}/apply`, { comment: appText, proposed_price: appPrice, proposed_deadline: nowdate })
            notify({ message: `Вы подали заявку на выполнение заказа #${task.id}`, type: "info", duration: 4200 });
        }
        catch (error) {
            console.log(error);
            notify({ message: `${error.response?.data?.detail || "Ошибка при подаче заявки"}`, type: "error", duration: 4200 });
        }
        update();
    }

    const update = () =>{
        setUpdate(prev => !prev);
    }

    const handleConfirm = () => {
        setConfirm(true);
    }

    const resultScenario = async (actionType) => {
        const actionMap = {
            1: { ownerAction: 'accept', message: 'Вы отметили завершенным заказ #' },
            2: { ownerAction: 'reject', message: 'Вы отправили в доработку заказ #' },
            3: { ownerAction: 'reopen', message: 'Вы перевыпустили заказ #' }
        };

        const selectedAction = actionMap[actionType];

        if (!selectedAction) {
            console.error('Invalid action type');
            return;
        }

        try {
            await api.post(`/tasks/${task.id}/review-result?action=${selectedAction.ownerAction}`);
            notify({
                message: `${selectedAction.message}${task.id}`,
                type: 'info',
                duration: 4200
            });
        } catch (error) {
            console.error('Error in resultScenario:', error);
        }
        finally {
            update();
        }
    };

    const sendOnCheck = async () => {
        try{
            await api.post(`/tasks/${task.id}/submit-for-review`);
            notify({message: `Вы отметили заказ #${task.id} выполненным`, type: 'info', duration: 4200});
            handleConfirm();
        }
        catch(error){
            console.log(error);
        }
    }


    const moderateDiscuse = async (typeaction) => {
        const actionMap = {
            1: { ownerAction: 'customer', message: 'Вы решили в сторону заказчика заказ #' },
            2: { ownerAction: 'freelancer', message: 'Вы решили в сторону фрилансера заказ #' },
        };

        const selectedSide = actionMap[typeaction];

        if (!selectedSide) {
            console.error('Invalid action type');
            return;
        }

        try {
            await api.post(`/tasks/${task.id}/resolve-dispute?winner=${selectedSide.ownerAction}`);
            notify({
                message: `${selectedSide.message}${task.id}`,
                type: 'info',
                duration: 4200
            });
        } catch (error) {
            console.error('Error in resultScenario:', error);
        }
        finally {
            update();
            navigate('/arbitrage')
        }
    }

    if (loading) {
        return (
            <Loader />
        )
    }

    const { diffresult, dayText, status } = CalcMinusDater(task.deadline);
    return (
        <>
            <div className='hatsaver'></div>
            <div className='blocktitle'>
                <SimpleButton icon="arrow-left" onClick={() => navigate(-1)}>Назад</SimpleButton>
                    заказ #{task.id}
                {task.status === "В процессе" &&
                    <div className='rev filler'>
                        {arbitrageState ? (
                            <div style={{fontSize: 14}} className='bfxrow aic gap5'>
                                <span>Открыть спор?</span>
                                <button className='skillremover' onClick={arbitrageMaker}>
                                    <Icon icon='check' color='var(--variable-collection-black)'/>
                                </button>
                                <button className='skillremover' onClick={switchArbBut}>
                                    <Icon icon='xmark' color='var(--variable-collection-black)'/>
                                </button>
                            </div>
                        ) : (
                            <button className='skillremover red' title='Открыть спор' onClick={switchArbBut}>
                                <Icon icon='warning' color='white' size={14}></Icon>
                            </button>
                        )}
                    </div>
                }
            </div>
            <div className="bodyblock gap10">
                <div className="bodyblock fxrow">
                    <div className="taskblock-insp">
                        <div className="taskblock-title">
                            {task.title}
                        </div>
                        <div className="taskblock-info">
                            <div className="taskblock-infoprops">
                                <div className="propblock accent">
                                    {task.category}
                                </div>
                                <div className="propblock">
                                    Опыт работы: {task.skill_level}
                                </div>
                                {task.status == "Открытая" ? (
                                    <div className={status ? "propblock black" : "propblock red"}>
                                        Срок: {diffresult} {dayText}
                                    </div>
                                ) : task.status == "В процессе" || task.status == "Спор" ? (
                                    <div className={status ? "propblock black" : "propblock red"}>
                                        Срок: {diffresult} {dayText}
                                    </div>
                                ) : null}
                            </div>
                            <AutoTextarea>{task.description}</AutoTextarea>
                            <TaskBudjet bmin={task.budget_min} bmax={task.budget_max} view="max"/>
                            <TaskStatus status={task.status}/>
                            {taskOwner.id === myuser.id && task.status === "На проверке заказчиком" ? (
                                <span style={{fontWeight: "600", fontSize: "14px", color: "var(--variable-collection-accent)"}}>
                                    Фрилансер отметил заказ выполненным, проверьте результат выполнения и выберите нужное действие справа
                                </span>
                            ) : task.status === "Спор" && myuser.user_type !== "moderator" ?(
                                <span style={{fontWeight: "600", fontSize: "14px", color: "orange"}}>
                                    Внимание! По данному заказу открыт спор, просьба обоих участников заказа расписать возникшие проблемы в чате.
                                    После анализа ситуации, модерация закроет данную задачу в одну из сторон.
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <div className="taskblock">
                        {myuser.id === taskOwner.id && task.status !== "На рассмотрении модерацией" ? (
                            <div className="tbtop">
                                {task.status === "Открытая" || task.status === "Отклонена модерацией" ? (
                                    <ConfirmSimpleButton style="red" icon="trash" action={handleTaskDelete}>
                                        Удалить заказ
                                    </ConfirmSimpleButton>
                                ) : (
                                    <div className="task-freelancerlinkfull">
                                        <span style={{color: "var(--variable-collection-black)"}}>{task.status !== "Закрытая" ? "В работе у" : "Заказ выполнил"}</span>
                                        <Link style={{ textDecoration: "none" }} to={`/profile/${taskFreelancer.id}`}>
                                            <div className="miniprofile">
                                                {taskFreelancer.username}
                                                <div className="miniprofile-avatar">
                                                    {taskFreelancer?.profile?.avatar_url ? (
                                                        <img src={`${SERVER_URL}${taskFreelancer.profile.avatar_url}`} alt="Аватар фрилансера" />
                                                    ) : (<div/>)}
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : task.status !== "На рассмотрении модерацией" && myuser.user_type !== "moderator" ? (
                            <div className="tbtop">
                                <div className="task-freelancerlinkfull">
                                    <span style={{color: "var(--variable-collection-black)"}}>Заказчик</span>
                                    <Link style={{ textDecoration: "none" }} to={`/profile/${taskOwner.id}`}>
                                        <div className="miniprofile">
                                            {taskOwner.username}
                                            <div className="miniprofile-avatar">
                                                {taskOwner?.profile?.avatar_url ? (
                                                    <img src={`${SERVER_URL}${taskOwner.profile.avatar_url}`} alt="Аватар заказчика" />
                                                ) : (<div/>)}
                                            </div>
                                            <div className="propblock black">
                                                <Icon icon="star" color="gold"/>
                                                {taskOwner.profile?.rating || "0.0"}
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        ) : task.status === "На рассмотрении модерацией" ? (
                            <div className="tbtop">
                                <ConfirmSimpleButton style="red" icon="trash" action={handleTaskDelete}>
                                    Удалить заказ
                                </ConfirmSimpleButton>
                            </div>
                        ) : myuser.user_type === 'moderator' && (
                            <div className="tbtop">
                                <div className="task-freelancerlinkfull">
                                    <div className="bfxcol gap5">
                                        <div className='bfxrow aic gap5 rev'>
                                            <span style={{color: "var(--variable-collection-black)"}}>Заказчик</span>
                                            <Link style={{ textDecoration: "none" }} to={`/profile/${taskOwner.id}`}>
                                                <div className="miniprofile">
                                                    <div className="miniprofile-avatar">
                                                        {taskOwner.profile.avatar_url ? (
                                                            <img src={`${SERVER_URL}${taskOwner.profile.avatar_url}`} alt="Аватар заказчика" />
                                                        ) : (<div/>)}
                                                    </div>
                                                    <div className="propblock black">
                                                        <Icon icon="star" color="gold"/>
                                                        {taskOwner.profile.rating || "0.0"}
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                        <div className='bfxrow aic gap5 rev'>
                                            <span style={{color: "var(--variable-collection-black)"}}>Исполнитель</span>
                                            <Link style={{ textDecoration: "none" }} to={`/profile/${taskFreelancer.id}`}>
                                                <div className="miniprofile">
                                                    {taskFreelancer.username}
                                                    <div className="miniprofile-avatar">
                                                        {taskFreelancer.profile.avatar_url ? (
                                                            <img src={`${SERVER_URL}${taskFreelancer.profile.avatar_url}`} alt="Аватар заказчика" />
                                                        ) : (<div/>)}
                                                    </div>
                                                    <div className="propblock black">
                                                        <Icon icon="star" color="gold"/>
                                                        {taskFreelancer.profile.rating || "0.0"}
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {myuser.user_type == "freelancer" ? (
                            <>
                                {task.status == "Открытая" ? (
                                <div className="tbbottom">
                                    {!isApped ? (
                                        <div className="bfxcol gap5">
                                            <Inputor type="text" maxLength={50} placeholder="Сообщение к отклику" onChange={(e) => setAppText(e.target.value)}></Inputor>
                                            <Inputor style={{minWidth: 100 + "px"}} type="number" max={999999} placeholder="Ваша цена" onChange={(e) => setAppPrice(e.target.value)}></Inputor>
                                            <SimpleButton icon="user" style="accent" onClick={handleSendApp}>Откликнуться</SimpleButton>
                                        </div>
                                    ) : (
                                        <div className="bfxcol gap20">
                                            <div className="propblock">Вы оставляли заявку на данный заказ</div>
                                        </div>
                                        )
                                    }
                                </div>
                                ) : task.status == "В процессе" ?(
                                    <div className="bfxrow rev gap5">
                                        <ConfirmSimpleButton icon='check' action={sendOnCheck}>Отметить выполненным</ConfirmSimpleButton>
                                    </div>
                                ) : task.status == "На проверке заказчиком" && (
                                    null
                                )}
                            </>
                        ) : myuser.user_type === "customer" ? (
                            <div className="tbbottom">
                                {task.status == "На проверке заказчиком" && (
                                    <div className='bfxcol gap5'>
                                        <ConfirmSimpleButton style='black' icon='repeat' action={() => resultScenario(3)}>Найти нового фрилансера</ConfirmSimpleButton>
                                        <ConfirmSimpleButton icon='clock' action={() => resultScenario(2)}>Требуются доработки</ConfirmSimpleButton>
                                        <ConfirmSimpleButton style='green' icon='check' action={() => resultScenario(1)}>Подтвердить выполнение</ConfirmSimpleButton>
                                    </div>
                                )}
                            </div>
                        ) : myuser.user_type === "moderator" && (
                            <div className="tbbottom">
                                <div className="bfxcol gap5">
                                    <ConfirmSimpleButton style='accent' icon='arrow-left' action={() => moderateDiscuse(1)}>Решить в сторону заказчика</ConfirmSimpleButton>
                                    <ConfirmSimpleButton style='accent' icon='arrow-right' action={() => moderateDiscuse(2)}>Решить в сторону фрилансера</ConfirmSimpleButton>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {task.status == "В процессе" || task.status == "На проверке заказчиком" ? (
                    <MessageViewer task={task} ></MessageViewer>
                ) : task.status == "Спор" && (
                    <MessageViewer task={task} ></MessageViewer>
                )}

                {task.status == "Закрытая" && (
                    <ReviewViewer taskOwner={taskOwner} taskFreelancer={taskFreelancer} task={task} myuser={myuser}/>
                )}

                {task.status == "Открытая" && myuser.user_type !== "freelancer" ? (
                    <FeedbacksViewer task={task} user={myuser.user_type} onConfirm={handleConfirm}></FeedbacksViewer>
                ) : null}

                {task.status === "Закрытая" && (
                    <>
                        {taskOwner.id === myuser.id && !task.customer_review ?(
                            <MakeReview task={task} taskowner={taskOwner} taskfreelancer={taskFreelancer} action={update}/>
                        ) : taskFreelancer.id === myuser.id && !task.freelancer_review && (
                            <MakeReview task={task} taskowner={taskOwner} taskfreelancer={taskFreelancer} action={update}/>
                        )}
                    </>
                )}
            </div >
        </>
    )
}

export default TaskViewer