import { Task } from "./tasks/Task.jsx"
import {useState, useEffect, useContext} from "react";
import api from "../services/api";
import SimpleButton from "./SimpleButton";
import {Link, useNavigate} from "react-router-dom";
import {AuthContext} from "../context/AuthContext.jsx";

export const MyTasks = () => {
    const {myuser} = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const routefilter =
        myuser.user_type === "freelancer" ? "assigned" :
            myuser.user_type === "customer" && "my"
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            if (routefilter == null) return;
            try {
                const response = await api.get(`/tasks/?filter=${routefilter}`);
                setTasks(response.data);
                setLoading(false);
            } catch (err) {
                {err.code == "ERR_BAD_REQUEST" && navigate("/login")};
                console.log(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [myuser]);

    const statusPriority = {
        "Открытая": 1,
        "На рассмотрении модерацией": 2,
        "В процессе": 3,
        "Закрытая": 4
    }
    const sortedTasks = tasks.sort((a, b) => {
        return statusPriority[a.status] - statusPriority[b.status];
    });

    if (loading) {
        return (
            <>
                <div className="hatsaver"></div>
                <div className="blocktitle">загрузка заказов...</div>
            </>
        )
    }

    if (tasks.length === 0) {
        return (
            <>
                <div className="hatsaver"></div>
                <div className="blocktitle">мои заказы</div>
                {myuser.user_type === "customer" ? (
                    <>
                    <div>Вы ещё не создавали заказы</div>
                    <Link style={{textDecoration: "none"}} to="/create">
                        <SimpleButton style="black" icon="plus">Создать заказ</SimpleButton>
                    </Link>
                    </>
                ) : (
                    <>
                    <div>У вас нету активных заказов</div>
                    <Link style={{textDecoration: "none"}} to="/orders">
                    <SimpleButton style="white" icon="search">Лента заказов</SimpleButton>
                    </Link>
                    </>
                    )}
            </>
        )
    }

    return (
        <>
            <div className="hatsaver"></div>
            <div className="blocktitle">мои заказы</div>
            <div className="bodyblock gap10">
                {sortedTasks.map((task) => (
                    <Task key={task.id} task={task} />
                ))}
            </div>
        </>

    )
}

export default MyTasks