import { ActionConfig } from 'custom-card-helpers';

export interface MM2ClockCardConfig {
  type: string;

  name?: string;
  show_warning?: boolean;
  show_error?: boolean;
  test_gui?: boolean;

  displayType: string = 'digital'; // options: digital, analog, both
  timeFormat: number = 24;
  displaySeconds: boolean = true;

  showPeriod: boolean = true;
  showPeriodUpper: boolean = false;
  clockBold: boolean = false;
  showDate: boolean = true;
  showWeek: boolean = false;
  dateFormat: string = 'dddd, LL';

  /* specific to the analog clock */
  analogSize: string = '200px';
  analogFace: string = 'simple'; // options: 'none', 'simple', 'face-###' (where ### is 001 to 012 inclusive)
  analogPlacement: string = 'bottom'; // options: 'top', 'bottom', 'left', 'right'
  analogShowDate: boolean | string = 'top'; // options: false, 'top', or 'bottom'
  secondsColor: string = '#888888';
  timezone: string = 'UTC';
  locale: string = 'en';
}
