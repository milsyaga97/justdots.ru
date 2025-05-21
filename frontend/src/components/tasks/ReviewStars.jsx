import { useState } from 'react';
import SimpleButton from "../SimpleButton.jsx";

export function ReviewStars({action}) {
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);

    return (
        <div className="reviewstars">
        <div className="propblock fxrow gap10">
        <div style={{display: "flex"}}>
            {[...Array(5)].map((_, i) => {
                const value = i + 1;
                return (
                    <div
                        key={i}
                        style={{ color: value <= (hover || rating) ? 'gold' : '#ccc', cursor: 'pointer', fontSize: '24px' }}
                        onClick={() => {setRating(value); action(value)}}
                        onMouseEnter={() => setHover(value)}
                        onMouseLeave={() => setHover(0)}
                    >
            <i className="fa-solid fa-star"></i>
          </div>
                );
            })}
            <input type="hidden" name="rating" value={rating}/>

        </div>

        </div>
        <SimpleButton>Оценить</SimpleButton>
        </div>
    );
}