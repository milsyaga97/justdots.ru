import React, {useEffect, useState} from 'react';
import Feedback from "./Feedback.jsx";
import {getAppCounter} from "../../utils/AppCounter.jsx";

const FeedbacksViewer = ({task, user, onConfirm}) => {
    const [apps, setApps] = useState(0);
    const [isClosed, setClosed] = useState(false);

    const closing = () => {
        setClosed(prevState => !prevState);
        onConfirm();
    }

    useEffect(() => {
        const fetchAppCounter = async () => {
            if (task && task.id) {
                const count = await getAppCounter(task.id);
                setApps(count);
            }
        };
        fetchAppCounter();
    }, [task?.id, closing]);

    if(isClosed) return;

    if(user == "freelancer") return;

    return (
        <div className="bodyblock gap10">
            <div className="titleblock">
                Заявки ({apps})
            </div>
            <Feedback taskid={task.id} closing={closing}></Feedback>
        </div>
    );
};

export default FeedbacksViewer;