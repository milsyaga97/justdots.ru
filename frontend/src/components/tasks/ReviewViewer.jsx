import React from 'react';
import ReviewItem from "../other/ReviewItem.jsx";

const ReviewViewer = ({taskOwner, taskFreelancer, task, myuser, updater}) => {
    if(!taskOwner || !taskFreelancer || !task || !myuser) return;

    return (
        <>
        {taskOwner.id === myuser.id && (task.customer_review || task.freelancer_review) ? (
                <>
                    {task.customer_review && (
                        <div className="bodyblock">
                            <div className="bfxcol gap10">
                                <div style={{color: "var(--variable-collection-black)"}} className="titleblock">
                                    Вы оставили отзыв:
                                </div>
                                <ReviewItem item={task.customer_review}></ReviewItem>
                            </div>
                        </div>
                    )}

                    {task.freelancer_review && (
                        <div className="bodyblock">
                            <div className="bfxcol gap10">
                                <div style={{color: "var(--variable-collection-black)"}} className="titleblock">
                                    Фрилансер оставил вам отзыв:
                                </div>
                                <ReviewItem item={task.freelancer_review}></ReviewItem>
                            </div>
                        </div>
                    )}
                </>
            ) : taskFreelancer.id === myuser.id && (task.customer_review || task.freelancer_review) ? (
            <>
                {task.freelancer_review && (
                    <div className="bodyblock">
                        <div className="bfxcol gap10">
                            <div style={{color: "var(--variable-collection-black)"}} className="titleblock">
                                Вы оставили отзыв:
                            </div>
                            <ReviewItem item={task.freelancer_review}></ReviewItem>
                        </div>
                    </div>
                )}

                {task.customer_review && (
                    <div className="bodyblock">
                        <div className="bfxcol gap10">
                            <div style={{color: "var(--variable-collection-black)"}} className="titleblock">
                                Заказчик оставил вам отзыв:
                            </div>
                            <ReviewItem item={task.customer_review}></ReviewItem>
                        </div>
                    </div>
                )}
            </>
        ) : null}
        </>
    );
};

export default ReviewViewer;