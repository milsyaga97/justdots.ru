import React from 'react';
import PortfolioItem from "../other/PortfolioItem.jsx";

const SkillsAndPortfolio = ({profile}) => {
    return (
        <div className='bodyblock gap5'>
            <div className='titleblock'>
                Навыки
            </div>
            <div className="textblock">
                <div className='skillsflex'>
                    {profile?.skills.map((skill, index) => (
                        <div key={index} className="propblock black">{skill.name}</div>
                    ))}
                </div>
            </div>
            <div style={{ paddingTop: 25 + "px" }} className='titleblock'>
                Портфолио
            </div>
            <div className='textblock bfxcol gap10'>
                {profile.profile?.portfolio.map((item, index) => (
                    <PortfolioItem key={index} item={item} viewFromProfile={true}></PortfolioItem>
                ))}
            </div>
        </div>
    );
};

export default SkillsAndPortfolio;