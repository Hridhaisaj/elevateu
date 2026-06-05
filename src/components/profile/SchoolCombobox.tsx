import { GraduationCap } from 'lucide-react'
import EntityCombobox, { type EntitySelection } from './EntityCombobox'

interface Props {
  value: EntitySelection
  onChange: (val: EntitySelection) => void
}

export default function SchoolCombobox({ value, onChange }: Props) {
  return (
    <EntityCombobox
      table="schools"
      value={value}
      onChange={onChange}
      icon={GraduationCap}
      placeholder="Search or add school…"
      logoLabel="Upload school logo"
    />
  )
}
