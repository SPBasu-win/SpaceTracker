type Props = { label: string; value: string | number; detail?: string }

export function StatTile({ label, value, detail }: Props) {
  return (
    <div className="tile">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  )
}
