import React, {useContext, useState} from 'react';
import InputorWLabel from "../InputorWLabel.jsx";
import {AuthContext} from "../../context/AuthContext.jsx";
import {ReviewStars} from "./ReviewStars.jsx";
import api from "../../services/api.jsx";
import {useNotification} from "../../context/Notifications.jsx";

const MakeReview = ({task, taskowner, taskfreelancer, action}) => {
    const {myuser} = useContext(AuthContext);
    const [rating, setRating] = useState(5);
    const [text, setText] = useState('');
    const notify = useNotification();


    const handleInput = (value) => {
        setRating(value);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!task) return;
        try{
            api.post(`/reviews/${task.id}/review`, {comment: text, score: rating});
            notify({message: `Вы успешно оставили отзыв по заказу #${task.id}`, type: "success", duration:4200});
        }
        catch(error){
            console.log(error);
            notify({message: `Произошла ошибка при отправке отзыва по заказу #${task.id}: ${error?.message}`, type: "success", duration:4200});
        }
        finally {
            action();
        }
    }

    if(!myuser) return;

    return (
        <div className="bodyblock gap10">
            <div className="titleblock">
                {taskowner.id === myuser.id ? (
                    "Пожалуйста, оставьте отзыв фрилансеру"
                ) : taskfreelancer.id === myuser.id &&(
                    "Пожалуйста, оставьте отзыв заказчику"
                )}

            </div>
            <form onSubmit={handleSubmit}>
                <InputorWLabel typea="textarea" label="Текст отзыва" onChange={(e) => setText(e.target.value)} required/>
                <ReviewStars action={handleInput}/>
            </form>
        </div>
    );
};

export default MakeReview;