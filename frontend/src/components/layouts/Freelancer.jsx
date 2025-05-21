import { useState, useContext, Children } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Navigate, useNavigate, Outlet, Route, Router } from 'react-router-dom';

export const Freelancer = () => {
    const { myuser } = useContext(AuthContext);

    if (myuser.user_type == "customer") {
        return <Navigate to={"/profile/" + myuser.id} />
    }


    return (
        <>
            <Outlet />
        </>
    );
}

export default Freelancer