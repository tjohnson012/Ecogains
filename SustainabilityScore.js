import React from 'react';

function SustainabilityScore({ score, factors }) {
  return (
    <div className="sustainability">
      <h2>Sustainability Score</h2>
      <p className="score">{score}/100</p>
      <ul>
        {factors.map((factor, index) => (
          <li key={index}>
            {factor.name}: {factor.score}/100
            <div className="score-bar" style={{ width: `${factor.score}%` }}></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SustainabilityScore;