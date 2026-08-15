import { MATRIX, TIERS } from '@/data/pricing';

function tierPrice(monthly: number | null) {
  if (monthly === null) return 'Contact Us';
  if (monthly === 0) return 'Free';
  return `$${monthly}/mo`;
}

export function PlanComparisonTable({ showPrices = false }: { showPrices?: boolean }) {
  return (
    <div className="pricing-table-wrap">
      <table className="matrix type-body">
        <caption className="pricing-matrix-caption type-title">Features by PetAppro plan</caption>
        <thead><tr><th scope="col">Feature</th>{TIERS.map((tier) => <th scope="col" key={tier.key}><span>{tier.name}</span>{showPrices && <small>{tierPrice(tier.monthly)}</small>}</th>)}</tr></thead>
        <tbody>{MATRIX.map((row) => <tr key={row.feature}><th scope="row">{row.feature}</th>{row.cells.map((cell, index) => <td key={`${row.feature}-${index}`}>{cell === true ? index === 0 ? <span className="visually-hidden">Included</span> : <span className="check" aria-label="Included">✓</span> : cell === false ? <span className="dash" aria-label="Not included">—</span> : cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
