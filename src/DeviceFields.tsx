import { useState } from 'react';
import { Clock3, Minus, Plus } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import ChoiceSelect from './ChoiceSelect';

const options = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const value = String(index).padStart(2, '0');
    return { value, label: value };
  });
const hours = options(24),
  minutes = options(60);

export function StatusTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hour, minute] = value.split(':');
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="device-time-trigger"
          aria-label="状态栏时间"
        >
          <span>{value}</span>
          <Clock3 size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="device-time-popover"
        align="start"
        collisionPadding={12}
        aria-label="状态栏时间选择器"
      >
        <div className="device-time-columns">
          <div>
            <span>时</span>
            <ChoiceSelect
              label="状态栏小时"
              value={hour}
              onValueChange={(next) => onChange(`${next}:${minute}`)}
              options={hours}
            />
          </div>
          <b aria-hidden="true">:</b>
          <div>
            <span>分</span>
            <ChoiceSelect
              label="状态栏分钟"
              value={minute}
              onValueChange={(next) => onChange(`${hour}:${next}`)}
              options={minutes}
            />
          </div>
        </div>
        <Button type="button" className="device-time-done" onClick={() => setOpen(false)}>
          完成
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function BatteryInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const clamp = (next: number) => onChange(Math.min(100, Math.max(0, next)));
  return (
    <div className="battery-control">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="减少电量"
        disabled={value === 0}
        onClick={() => clamp(value - 1)}
      >
        <Minus size={12} />
      </Button>
      <Input
        aria-label="电量百分比"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        role="spinbutton"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        value={value}
        onChange={(event) => {
          if (/^\d*$/.test(event.target.value)) clamp(Number(event.target.value));
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            clamp(value + (event.key === 'ArrowUp' ? 1 : -1));
          }
          if (event.key === 'Home') {
            event.preventDefault();
            clamp(0);
          }
          if (event.key === 'End') {
            event.preventDefault();
            clamp(100);
          }
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="增加电量"
        disabled={value === 100}
        onClick={() => clamp(value + 1)}
      >
        <Plus size={12} />
      </Button>
    </div>
  );
}
