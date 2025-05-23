import React, { useState, useEffect, useContext } from 'react';
import { useNotification } from '../context/Notifications.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Loader from './Loader.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import SimpleButton from './SimpleButton.jsx';
import { CalcDater } from '../utils/CalcDater.jsx';
import { SERVER_URL } from '../pathconfig.js';
import Icon from "./other/Icon.jsx";
import ProfileEditor from "./ProfileEditor.jsx";
import AutoTextarea from "./other/AutoTextarea.jsx";
import PortfolioItem from "./other/PortfolioItem.jsx";
import ReviewItem from "./other/ReviewItem.jsx";
import SkillsAndPortfolio from "./freelancer/SkillsAndPortfolio.jsx";

const Profile = () => {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [profileReviews, setProfileReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [changemode, setChangeMode] = useState(false);
    const { myuser } = useContext(AuthContext);
    const notify = useNotification();
    const navigate = useNavigate();
    const [isUpdated, setUpdate] = useState(false);


    useEffect(() => {
        const Fetcher = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/users/profile/${id}`);
                setProfile(response.data);
            } catch (error) {
                {error.code == "ERR_BAD_REQUEST" && navigate("/login")};
                console.error('Ошибка при получении профиля: ', error)
                setProfile(myuser);
                notify({ message: "Ошибка при получении профиля", type: "error", duration: 4200 });
                navigate("/profile/" + myuser.id);
            }
            finally {
                setLoading(false);
            }
        };

        Fetcher();
    }, [id, isUpdated, changemode])

    useEffect(() => {
        const ReviewsFetcher = async () => {
            if(!profile) return;
            try{
                const response = await api.get(`/reviews/user/${profile.id}`);
                setProfileReviews(response.data);
            }
            catch(error){
                console.error(error);
            }
        }
        ReviewsFetcher();
    }, [profile]);


    const [sortMethod, setSortMethod] = useState(true);
    const switchSortMethod = () => {
        setSortMethod(prev => !prev);
    }
    const sortedReviews = [...(profileReviews || [])].sort((a,b) => {
        return sortMethod ? b.score - a.score : a.score - b.score;
    })

    const refreshProfile = () => {
        setUpdate(true);
        reChangeMode();
    }

    const changeMode = () =>{
        setChangeMode(true);
    }
    const reChangeMode = () => {
        setChangeMode(false);
    }

    if (loading) {
        return <Loader></Loader>
    }
    if(!profile) return;

    if(changemode) return <ProfileEditor profile={profile} action={reChangeMode} onsub={refreshProfile}></ProfileEditor>

    const { daysDiff, dayText } = CalcDater(profile.created_at);
    return (
        <>
            <div className='hatsaver'></div>
            <div className='blocktitle'>
                {profile && profile.id === myuser.id ? "мой профиль" : "профиль пользователя "}
            </div>
            <div className='bodyblock'>
                <div className='filler'>
                    <div className='ellipse-profile'>
                        <img src={profile.profile?.avatar_url ? `${SERVER_URL + profile.profile?.avatar_url}` : null} />
                    </div>
                    <div className='profile-info'>
                        <div className='profile-info-name'>
                            <span>{profile.username}</span>
                        </div>
                        <div className='profile-info-work'>
                            {profile.user_type == "customer" ?
                                (
                                    <div className='propblock black'>
                                        Заказчик
                                    </div>
                                ) : profile.user_type == "moderator" ?(
                                    <div className='propblock accent'>
                                        Модератор
                                    </div>
                                ):(
                                    <div className='propblock'>
                                        Исполнитель
                                    </div>
                                )
                            }
                            <div className={"propblock black"}>
                                <Icon icon="star" color="gold"></Icon>
                                {profile?.profile?.rating || "0"}
                            </div>
                            <div className='propblock accent'>
                                {profile?.completed_tasks_count} {profile?.user_type == "freelancer" ? "выполненных" : "завершённых"} заказов
                            </div>
                        </div>
                        <div className='profile-info-sub'>
                            <div className='simplepropblock'>
                                <Icon icon="circle-user"/>
                                {profile?.last_name} {profile?.first_name} {profile?.patronymic}
                            </div>
                            <div className='simplepropblock'>
                                <Icon icon="calendar"/>
                                на justdots {daysDiff} {dayText}
                            </div>
                            {profile.user_type === "customer" ? (
                                <div className='simplepropblock'>
                                    <Icon icon="ruble-sign"/>
                                    выплачено {profile.profile.total_spent} рублей
                                </div>
                            ) : profile.user_type === "freelancer" ? (
                                <div className='simplepropblock'>
                                    <Icon icon="ruble-sign"/>
                                    заработано {profile.profile.total_earned} рублей
                                </div>
                            ) : null}
                        </div>
                    </div>
                    <div className='profile-edit-container'>
                        {myuser?.id == profile?.id && (
                            <SimpleButton icon='edit' onClick={changeMode}>Редактировать профиль</SimpleButton>
                        )}
                    </div>
                </div>
                <div style={{ paddingTop: 25 + "px" }} className='titleblock'>
                    Обо мне
                </div>
                <div className='textblock'>
                    <AutoTextarea>{profile?.profile?.bio}</AutoTextarea>
                </div>
            </div>

            {profile?.user_type === "freelancer" && (
                <SkillsAndPortfolio profile={profile}></SkillsAndPortfolio>
            )}

            <div className='bodyblock gap10'>
                <div style={{color: "var(--variable-collection-black"}} className="titleblock bfxrow aic gap10">
                    Отзывы ({profileReviews.length})
                    <SimpleButton icon={sortMethod ? "caret-down" : "caret-up"} onClick={switchSortMethod}>
                        {sortMethod ? "Сначала положительные" : "Сначала отрицательные"}
                    </SimpleButton>
                </div>
                {profileReviews.length > 0 &&(
                    <div className="textblock bfxcol gap10">
                        {sortedReviews?.map((review, index) => (
                            <ReviewItem key={index} item={review}></ReviewItem>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default Profile;