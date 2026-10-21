import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';

export default function ChoiceSelect<T extends string>({
  value,
  onValueChange,
  label,
  options,
}: {
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (options.some((option) => option.value === next)) onValueChange(next as T);
      }}
    >
      <SelectTrigger className="studio-select-trigger" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="studio-select-content" sideOffset={4} collisionPadding={12}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
