import React, {useEffect, useState} from 'react';
import api from "../../services/api.jsx";
import {useNotification} from "../../context/Notifications.jsx";
import SimpleButton from "../SimpleButton.jsx";
import {Link} from "react-router-dom";
import Icon from "../other/Icon.jsx";

const MyApplications = () => {
    const [apps, setApps] = useState([]);
    const notify = useNotification();
    const [update, setUpdate] = useState(false);

    useEffect(() => {
        const appsFetcher = async () => {
            try{
                const response = await api.get(`/tasks/applications`);
                setApps(response.data);
            }
            catch(error){
                console.error(error);
                notify({message: "Произошла ошибка при загрузке информации", type: "error", duration: 4200});
            }
        }
        appsFetcher();
    }, [update]);

    const updateSwitch = () => {
        setUpdate(prev => !prev);
    }

    const handleRecallApp = async (app) => {
        try{
            await api.post(`/tasks/applications/cancel/?application_id=${app.id}`);
            notify({message: `Вы отозвали заявку на заказ #${app.task_id}`});
            updateSwitch();
        }
        catch(error){
            console.error(error);
        }
    }

    const mapAppStatus = {
        "На рассмотрении": 1,
        "Принята": 2,
        "Отклонена": 3
    }

    const statusColors = {
        "На рассмотрении": "var(--variable-collection-blackprop)",
        "Принята": "limegreen",
        "Отклонена": "red"
    }

    const sortedApps = apps.sort((a, b) => {
        return mapAppStatus[a.status] - mapAppStatus[b.status];
    });

    return (
        <>
            <div className="hatsaver"></div>
            <div className="blocktitle">мои заявки</div>
            <div className="bodyblock gap5">
                {sortedApps.map((item, index) => (
                    <div key={index} className="bodyblock fxrow aic gap5">
                        <Link style={{textDecoration: "none"}} to={`/task/${item.task_id}`}>
                            <SimpleButton style="black" icon="search"></SimpleButton>
                        </Link>
                        <div className="propblock">
                            <div className="titleblock">Заказ #{item.task_id}</div>
                        </div>
                        <div className="propblock bfxrow gap10">
                            <Icon icon="quote-right"></Icon>
                            {item.comment}
                        </div>
                        <div className="propblock accent">
                            {item.proposed_price}
                            <Icon icon="ruble-sign"></Icon>
                        </div>
                        <div className="rev filler">
                            {item.status === "На рассмотрении" ? (
                                <SimpleButton style="black" icon="arrow-rotate-left" onClick={() => handleRecallApp(item)}>Отозвать заявку</SimpleButton>
                            ) : (
                                <div style={{background: statusColors[item.status]}}  className="propblock black">{item.status}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default MyApplications;