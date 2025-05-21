import { useEffect, useState } from "react";
import api from '../../services/api';
import MiniProfile from "./MiniProfile.jsx";
import { Link } from "react-router-dom";
import SimpleButton from "../SimpleButton.jsx";
import {useNotification} from "../../context/Notifications.jsx";
import Icon from "../other/Icon.jsx";

export const Feedback = ({ taskid, onAction, closing }) => {
    const [feedbacks, setFeedbacks] = useState([]);
    const notify = useNotification();

    const feedbackFetcher = async () => {
        if (!taskid) return;
        try {
            const response = await api.get(`/tasks/applications/?task_id=${taskid}`);
            const filteredFeedbacks = response.data.filter(feedback => feedback.status === "На рассмотрении");
            setFeedbacks(filteredFeedbacks);
        }
        catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        feedbackFetcher();
    }, [taskid])

    const feedbackAccept = async (id) => {
        if (!id) return;
        try {
            const response = await api.post(`/tasks/${taskid}/applications/${id}/accept`);
            console.log(response);
            notify({message: `Вы передали заказ #${taskid} в работу`, type: "success", duration: 4200});
        }
        catch (error) {
            console.log(error);
        }
        finally {
            feedbackFetcher();
            closing();
        }
    }

    const feedbackReject = async (id) => {
        if (!id) return;
        try {
            const response = await api.post(`/tasks/${taskid}/applications/${id}/reject`);
            console.log(response);
        }
        catch (error) {
            console.log(error);
        }
        finally {
            feedbackFetcher();
        }
    }

    return (
        <>
            {feedbacks.map((feedback) => (
                <div key={feedback.id} className="feedbackblock">
                    <Link style={{ textDecoration: "none" }} to={`/profile/` + feedback.freelancer_id}>
                        <MiniProfile id={feedback.freelancer_id}/>
                    </Link>
                    <div className="bodyblock feedbackcom">
                        {feedback.comment}
                    </div>
                    <div className="feedbackint filler">
                        <div className="propblock fbp">
                            {feedback.proposed_price}
                            <Icon icon="ruble-sign"/>
                        </div>
                        <SimpleButton icon="check" style="accent" onClick={() => {feedbackAccept(feedback.id); onAction?.();}}>Принять</SimpleButton>
                        <SimpleButton icon="xmark" style="black"  onClick={() => {feedbackReject(feedback.id); onAction?.();}}>Отклонить</SimpleButton>
                    </div>
                </div>
            ))}
        </>
    )
}

export default Feedback