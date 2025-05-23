import { Task } from "../tasks/Task.jsx"
import { useState, useEffect } from "react";
import api from "../../services/api.jsx";
import {Link, useNavigate} from "react-router-dom";
import SimpleButton from "../SimpleButton.jsx";

export const PublicTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [isRefresh, setRefresh] = useState(false);

    const filterMapType = {
        1: "",
        2: "Разработка",
        3: "Дизайн",
        4: "Программирование",
        5: "Копирайтинг"
    }
    const [curFilterType, setFilterType] = useState(1);

    const filterMapSkill = {
        1: "",
        2: "Менее года",
        3: "От 1 до 3 лет",
        4: "Более 3 лет"
    }
    const [curFilterSkill, setFilterSkill] = useState(1);

    useEffect(() => {
        const routeurl = `/tasks/?filter=public${curFilterType > 1 ? `&category=${filterMapType[curFilterType]}` : ''}${curFilterSkill > 1 ? `&skill_level=${filterMapSkill[curFilterSkill]}` : ''}`;
        const fetchTasks = async () => {
            try {
                const response = await api.get(routeurl);
                setTasks(response.data);
            } catch (err) {
                {err.code == "ERR_BAD_REQUEST" && navigate("/login")};
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [isRefresh, curFilterType, curFilterSkill]);

    const Refresher = () => {
        setRefresh(prev => !prev);
    }

    useEffect(() => {
        const intervalId = setInterval(() => {
            Refresher();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

    const [sortMethod, setSortMethod] = useState(false);
    const switchSortMethod = () => {
        setSortMethod(prev => !prev);
    }

    const sortedTasks = [...(tasks || [])].sort((a,b) => {
        return sortMethod ? b.budget_max - a.budget_max : b.owner_profile.rating - a.owner_profile.rating;
    })

    if (loading) {
        return (
            <>
                <div className="hatsaver"></div>
                <div className="blocktitle">загрузка заказов...</div>
            </>
        )
    }

    return (
        <>
            <div className="hatsaver"></div>
            <div className="blocktitle">лента заказов</div>
            <div className="bodyblock gap10">
                <div className="bfxrow aic gap10">
                    <SimpleButton style="black" icon={sortMethod ? "ruble-sign" : "star"} iconColor={sortMethod ? "limegreen" : "gold"} onClick={switchSortMethod}>Сортировка по {sortMethod ? "цене" : "рейтингу"}</SimpleButton>
                    <div className="propblock black fs16">Категория:
                    <select className="propblock fs16" onChange={(e) => setFilterType(e.target.value)}>
                        <option value={1}>Все</option>
                        <option value={2}>Разработка</option>
                        <option value={3}>Дизайн</option>
                        <option value={4}>Программирование</option>
                        <option value={5}>Копирайтинг</option>
                        <option value={1}>Другое</option>
                    </select>
                    </div>
                    <div className="propblock black fs16">Опыт работы:
                    <select className="propblock fs16" onChange={(e) => setFilterSkill(e.target.value)}>
                        <option value={1}>Все</option>
                        <option value={2}>Менее года</option>
                        <option value={3}>От 1 до 3 лет</option>
                        <option value={4}>Более 3 лет</option>
                    </select>
                    </div>
                    <div className="rev filler">
                        <SimpleButton style="accent" icon="refresh" onClick={Refresher}></SimpleButton>
                    </div>
                </div>
            {tasks.length > 0 ? (
                <>
                    {sortedTasks.map((task) => (

                            <Task key={task.id} task={task} trigger={isRefresh}/>

                    ))}
                </>
            ) : "Новых заказов нет"}
            </div>
        </>

    )
}

export default PublicTasks