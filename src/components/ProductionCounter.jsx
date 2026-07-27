export default function ProductionCounter({ label, quantity, onChange }) {
  return <div className="production-counter"><span>{label}</span><div><button type="button" onClick={() => onChange(quantity - 1)} disabled={!quantity} aria-label={`Quitar ${label}`}>−</button><b>{quantity}</b><button type="button" onClick={() => onChange(quantity + 1)} disabled={quantity >= 10} aria-label={`Agregar ${label}`}>+</button></div></div>;
}
