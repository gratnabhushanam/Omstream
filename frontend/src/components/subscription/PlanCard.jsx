import React from 'react';
import { Star, Shield, Crown, Gem, Check, X } from 'lucide-react';

export default function PlanCard({ plan, billingCycle, isCurrentPlan, onSelect, isSelected }) {
  const { tier, name, pricing, highlights, recommended, features } = plan;
  const price = pricing[billingCycle];
  const formattedPrice = price === 0 ? 'Free' : `₹${price / 100}`;

  const renderIcon = () => {
    switch (tier) {
      case 'free': return <Star className="w-8 h-8" />;
      case 'silver': return <Shield className="w-8 h-8" />;
      case 'gold': return <Crown className="w-8 h-8" />;
      case 'diamond': return <Gem className="w-8 h-8" />;
      default: return <Star className="w-8 h-8" />;
    }
  };

  const getCycleLabel = () => {
    switch (billingCycle) {
      case 'monthly': return '/ month';
      case 'quarterly': return '/ quarter';
      case 'annual': return '/ year';
      default: return '';
    }
  };

  return (
    <div className={`plan-card plan-card-${tier} ${isSelected ? 'selected' : ''} ${isCurrentPlan ? 'current-plan' : ''}`}>
      {recommended && <div className="plan-badge">Best Value</div>}
      {tier === 'diamond' && <div className="plan-badge plan-badge-diamond">Ultimate</div>}

      <div className={`tier-icon-wrapper tier-icon-${tier}`}>
        {renderIcon()}
      </div>

      <h3 className="text-xl font-bold mb-1 font-sans capitalize">{name}</h3>
      <p className="text-sm text-zinc-400 mb-4 h-10">{plan.description || 'Access spiritual content'}</p>

      <div className="mb-6">
        <span className="text-3xl font-extrabold">{formattedPrice}</span>
        {price > 0 && <span className="text-zinc-400 text-sm ml-1">{getCycleLabel()}</span>}
      </div>

      <button
        onClick={() => onSelect(tier)}
        className={`plan-cta plan-cta-${tier} transition`}
      >
        {isCurrentPlan ? 'Current Plan' : price === 0 ? 'Get Started' : 'Subscribe Now'}
      </button>

      <div className="feature-list">
        {highlights.map((highlight, idx) => (
          <div key={idx} className="feature-item">
            <Check className="feature-check w-4 h-4" />
            <span>{highlight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
