import { MATRIX, TIERS } from '@/data/pricing';

function tierPrice(monthly: number | null) {
  if (monthly === null) return 'Contact Us';
  if (monthly === 0) return 'Free';
  return `$${monthly}/mo`;
}

export function PlanComparisonTable({ showPrices = false, currentKey, selectedKey, onSelect }: {
  showPrices?: boolean;
  currentKey?: string;
  selectedKey?: string;
  onSelect?: (key: string) => void;
}) {
  const selectable = Boolean(onSelect);
  const columnClass = (key: string) => selectable ? key === selectedKey ? ' is-plan-selected' : key === currentKey ? ' is-plan-current' : '' : '';
  return (
    <div className="pricing-table-wrap">
      <table className="matrix type-body">
        <caption className="pricing-matrix-caption type-title">Features by PetAppro plan</caption>
        <thead><tr><th scope="col">Feature</th>{TIERS.map((tier) => <th scope="col" className={columnClass(tier.key).trim() || undefined} key={tier.key}><span>{tier.name}</span>{showPrices && <small>{tierPrice(tier.monthly)}</small>}{selectable && (tier.monthly === null ? <small className="plan-select-option is-unavailable">Contact us</small> : <label className="plan-select-option"><input type="radio" name="plan-select" value={tier.key} checked={selectedKey === tier.key} onChange={() => onSelect?.(tier.key)} /><span>{tier.key === currentKey ? 'Current plan' : 'Select'}</span></label>)}</th>)}</tr></thead>
        <tbody>{MATRIX.map((row) => <tr key={row.feature}><th scope="row">{row.feature}</th>{row.cells.map((cell, index) => <td className={columnClass(TIERS[index].key).trim() || undefined} key={`${row.feature}-${index}`}>{cell === true ? index === 0 ? <span className="visually-hidden">Included</span> : <span className="check" aria-label="Included">✓</span> : cell === false ? <span className="dash" aria-label="Not included">—</span> : cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
