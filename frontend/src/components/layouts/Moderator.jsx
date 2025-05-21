import {useContext, useEffect} from 'react';
import { AuthContext } from '../../context/AuthContext';
import {Navigate, Outlet, useNavigate} from 'react-router-dom';
import Loader from '../Loader.jsx';
import {useNotification} from "../../context/Notifications.jsx";


export const Moderator = () => {
    const {myuser, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const notify = useNotification();

    useEffect(() => {
        if (myuser && myuser.user_type !== "moderator") {
            notify({
                message: "Отказано в доступе",
                type: "error",
                duration: 4200
            });
            navigate(-1);
        }
    }, [myuser, navigate, notify]);

    if (loading) {
        return <Loader></Loader>
    }

    return (
        <>
            <div className='main-container'>
                <Outlet />
            </div>
        </>
    );
}