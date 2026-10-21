import { lazy, Suspense, useState } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';
import { zhCN } from 'date-fns/locale';
const Calendar = lazy(() =>
  import('./components/ui/calendar').then((module) => ({ default: module.Calendar })),
);
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';

/** Keep wall-clock text intact: chat-time.ts applies the Shanghai timezone. */
export default function DateTimePicker({
  value,
  defaultValue = '',
  onValueChange,
  name,
  label,
  autoFocus,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  label: string;
  autoFocus?: boolean;
}) {
  const [local, setLocal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const current = value ?? local;
  const [dateText, time = '00:00'] = current.split('T');
  const [year, month, day] = dateText.split('-').map(Number);
  const selected = year && month && day ? new Date(year, month - 1, day) : undefined;
  const update = (next: string) => {
    setLocal(next);
    onValueChange?.(next);
  };
  return (
    <div className="date-time-picker">
      {name && <input type="hidden" name={name} value={current} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="date-time-trigger"
            aria-label={label}
            autoFocus={autoFocus}
          >
            <CalendarDays size={15} />
            <span>{dateText ? `${dateText}  ${time}` : '选择日期与时间'}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="date-time-popover"
          align="start"
          collisionPadding={12}
          aria-label={`${label}选择器`}
        >
          <Suspense
            fallback={
              <div className="calendar-loading" role="status">
                正在加载日历…
              </div>
            }
          >
            <Calendar
              className="studio-calendar"
              mode="single"
              locale={zhCN}
              selected={selected}
              defaultMonth={selected}
              captionLayout="dropdown"
              startMonth={new Date(1970, 0)}
              endMonth={new Date(2100, 11)}
              labels={{
                labelNext: () => '下个月',
                labelPrevious: () => '上个月',
                labelMonthDropdown: () => '选择月份',
                labelYearDropdown: () => '选择年份',
              }}
              onSelect={(date) => {
                if (date)
                  update(
                    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${time}`,
                  );
              }}
            />
          </Suspense>
          <div className="date-time-footer">
            <label>
              <Clock3 size={15} />
              <span>时间</span>
              <Input
                aria-label={`${label}时分`}
                type="time"
                step={60}
                value={time}
                onChange={(event) => {
                  if (event.target.value && dateText) update(`${dateText}T${event.target.value}`);
                }}
              />
            </label>
            <Button type="button" onClick={() => setOpen(false)}>
              完成
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
