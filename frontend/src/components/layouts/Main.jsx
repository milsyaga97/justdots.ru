import { useState, useContext, Children } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Navigate, useNavigate, Outlet, Route, Router } from 'react-router-dom';
import Loader from '../Loader.jsx';

export const Main = () => {
    const { isAuthenticated, loading } = useContext(AuthContext);
    if (loading) {
        return <Loader></Loader>
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" />
    }
    return (
        <>
            <div className='main-container'>
                <Outlet />
            </div>
        </>
    );
}