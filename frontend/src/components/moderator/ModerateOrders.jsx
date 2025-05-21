import React, {useEffect, useState} from 'react';
import api from "../../services/api.jsx";
import Order from "./Order.jsx";
import {useNavigate} from "react-router-dom";

const ModerateOrders = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await api.get('/tasks/?status=На рассмотрении модерацией');
                setTasks(response.data);
            } catch (err) {
                {err.code == "ERR_BAD_REQUEST" && navigate("/login")};
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    if (loading) {
        return (
            <>
                <div className="hatsaver"></div>
                <div className="blocktitle">загрузка заказов...</div>
            </>
        )
    }

    if (error) {
        return (
            <>
                <div className="hatsaver"></div>
                <div>Ошибка: {error.message || "неизвестная"}</div>
            </>
        )
    }

    if (tasks.length === 0) {
        return (
            <>
                <div className="hatsaver"></div>
                <div className="blocktitle">модерация заказов</div>
                <div>Новых заказов нет</div>
            </>
        )
    }

    return (
        <>
            <div className="hatsaver"></div>
            <div className="blocktitle">модерация заказов</div>
            <div className="bodyblock gap10">
                {tasks.map((task) => (
                    <Order key={task.id} task={task} />
                ))}
            </div>
        </>

    )
};

export default ModerateOrders;