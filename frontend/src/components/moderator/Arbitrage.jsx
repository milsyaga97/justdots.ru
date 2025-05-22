import React, {useEffect, useState} from 'react';
import api from "../../services/api.jsx";
import Order from "./Order.jsx";
import Discuse from "./Discuse.jsx";

const Arbitrage = () => {
    const [tasks, setTasks] = useState([]);

    const fetchTasks = async () => {
        try{
            const response = await api.get(`/tasks/disputes`);
            setTasks(response.data);
        }
        catch(error){
            console.error(error);
        }
    }

    useEffect(() => {
        fetchTasks()
    }, []);


    if(tasks.length === 0) {
        return (
            <>
                <div className="hatsaver"></div>
                <div className="blocktitle">арбитраж</div>
                Новых заказов нет
            </>
        )
    }

    return (
        <>
            <div className="hatsaver"></div>
            <div className="blocktitle">арбитраж</div>
            <div className="bodyblock gap10">
            {tasks.map((item, index) => (
                <Discuse key={index} task={item}></Discuse>
            ))}
            </div>
        </>
    );
};

export default Arbitrage;