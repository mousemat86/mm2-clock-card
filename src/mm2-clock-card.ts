import { LitElement, html, customElement, property, CSSResult, css, TemplateResult, PropertyValues } from 'lit-element';
import { HomeAssistant, hasConfigOrEntityChanged, LovelaceCardEditor, getLovelace } from 'custom-card-helpers';

// import './editor';

import { MM2ClockCardConfig } from './types';
import { CARD_VERSION } from './const';

import { localize } from './localize/localize';

// import * as moment from 'moment';
import moment from 'moment-timezone';

/* eslint no-console: 0 */
console.info(
  `%c  MM2-CLOCK-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

@customElement('mm2-clock-card')
export class MM2ClockCard extends LitElement {
  // public static async getConfigElement(): Promise<LovelaceCardEditor> {
  //   return document.createElement('mm2-clock-card-editor') as LovelaceCardEditor;
  // }

  public static getStubConfig(): object {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  @property() public hass?: HomeAssistant;
  @property() private _config?: MM2ClockCardConfig;
  @property() public second: number;
  @property() public minute: number;

  public setConfig(config: MM2ClockCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config || config.show_error) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    const defaults = {
      displayType: 'digital', // options: digital, analog, both

      timeFormat: 12,
      displaySeconds: true,
      showPeriod: true,
      showPeriodUpper: false,
      clockBold: false,
      showDate: true,
      showWeek: false,
      dateFormat: 'dddd, LL',

      /* specific to the analog clock */
      analogSize: '200px',
      analogFace: 'simple', // options: 'none', 'simple', 'face-###' (where ### is 001 to 012 inclusive)
      analogPlacement: 'bottom', // options: 'top', 'bottom', 'left', 'right'
      analogShowDate: 'top', // options: false, 'top', or 'bottom'
      secondsColor: '#888888',
      timezone: 'UTC',
      locale: 'en',
    };

    this._config = {
      ...defaults,
      ...config,
    };

    // Schedule update interval.
    this.start();
  }

  constructor() {
    super();

    this.second = moment().second();
    this.minute = moment().minute();
  }

  private start(): void {
    console.info('Starting MM2 Clock...');

    //Calculate how many ms should pass until next update depending on if seconds is displayed or not
    const delayCalculator = (reducedSeconds): number => {
      if (this._config.displaySeconds) {
        return 1000 - moment().milliseconds();
      } else {
        return (60 - reducedSeconds) * 1000 - moment().milliseconds();
      }
    };

    //A recursive timeout function instead of interval to avoid drifting
    const notificationTimer = (): void => {
      //If seconds is displayed CLOCK_SECOND-notification should be sent (but not when CLOCK_MINUTE-notification is sent)
      if (this._config.displaySeconds) {
        this.second = (this.second + 1) % 60;
        if (this.second !== 0) {
          setTimeout(notificationTimer, delayCalculator(0));
          return;
        }
      }

      //If minute changed or seconds isn't displayed send CLOCK_MINUTE-notification
      this.minute = (this.minute + 1) % 60;
      setTimeout(notificationTimer, delayCalculator(0));
    };

    //Set the initial timeout with the amount of seconds elapsed as reducedSeconds so it will trigger when the minute changes
    setTimeout(notificationTimer, delayCalculator(this.second));

    // Set locale.
    moment.locale(this._config.locale);
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntityChanged(this, changedProps, true);
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html``;
    }

    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this._config.show_warning) {
      return html`
        <ha-card>
          <div class="warning">${localize('common.show_warning')}</div>
        </ha-card>
      `;
    }

    return html`
      <ha-card tabindex="0" aria-label=${`MM2ClockCard`}>${this.getDom()}</ha-card>
    `;
  }

  getCardSize(): number {
    return this._config.displayType !== 'digital' ? 6 : 2;
  }

  static get styles(): CSSResult {
    return css`
      .clockCircle {
        margin: 0 auto;
        position: relative;
        border-radius: 50%;
        background-size: 100%;
      }

      .clockFace {
        width: 100%;
        height: 100%;
      }

      .clockFace::after {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 6px;
        height: 6px;
        margin: -3px 0 0 -3px;
        background: var(--paper-item-icon-color);
        border-radius: 3px;
        content: '';
        display: block;
      }

      .clockHour {
        width: 0;
        height: 0;
        position: absolute;
        top: 50%;
        left: 50%;
        margin: -2px 0 -2px -25%; /* numbers much match negative length & thickness */
        padding: 2px 0 2px 25%; /* indicator length & thickness */
        background: var(--paper-item-icon-color);
        -webkit-transform-origin: 100% 50%;
        -ms-transform-origin: 100% 50%;
        transform-origin: 100% 50%;
        border-radius: 3px 0 0 3px;
      }

      .clockMinute {
        width: 0;
        height: 0;
        position: absolute;
        top: 50%;
        left: 50%;
        margin: -35% -2px 0; /* numbers must match negative length & thickness */
        padding: 35% 2px 0; /* indicator length & thickness */
        background: var(--paper-item-icon-color);
        -webkit-transform-origin: 50% 100%;
        -ms-transform-origin: 50% 100%;
        transform-origin: 50% 100%;
        border-radius: 3px 0 0 3px;
      }

      .clockSecond {
        width: 0;
        height: 0;
        position: absolute;
        top: 50%;
        left: 50%;
        margin: -38% -1px 0 0; /* numbers must match negative length & thickness */
        padding: 38% 1px 0 0; /* indicator length & thickness */
        background: #888;
        -webkit-transform-origin: 50% 100%;
        -ms-transform-origin: 50% 100%;
        transform-origin: 50% 100%;
      }

      .dimmed {
        color: var(--disabled-text-color);
      }

      .normal {
        color: var(--paper-item-icon-color);
      }

      .bright {
        color: var(--primary-text-color);
      }

      .large {
        font-size: 65px;
        line-height: 65px;
      }

      .medium {
        font-size: 30px;
        line-height: 35px;
      }

      #mm2-clock-card {
        color: var(--disabled-text-color);
        /* font-family: 'Roboto Condensed', sans-serif; */
        font-weight: 400;
        font-size: 2em;
        line-height: 1.5em;
        -webkit-font-smoothing: antialiased;
        padding: 16px;
      }

      sup {
        font-size: 50%;
        line-height: 50%;
      }

      .thin {
        /* font-family: Roboto, sans-serif; */
        font-weight: 100;
      }

      .light {
        /* font-family: 'Roboto Condensed', sans-serif; */
        font-weight: 300;
      }

      .regular {
        /* font-family: 'Roboto Condensed', sans-serif; */
        font-weight: 400;
      }

      .bold {
        /* font-family: 'Roboto Condensed', sans-serif; */
        font-weight: 700;
      }
    `;
  }

  public getDom(): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.id = 'mm2-clock-card';

    /************************************
     * Create wrappers for DIGITAL clock
     */

    const dateWrapper = document.createElement('div');
    const timeWrapper = document.createElement('div');
    const secondsWrapper = document.createElement('sup');
    const periodWrapper = document.createElement('span');
    const weekWrapper = document.createElement('div');
    const clockCircle = document.createElement('div');
    // Style Wrappers
    dateWrapper.className = 'date normal medium';
    timeWrapper.className = 'time bright large light';
    secondsWrapper.className = 'dimmed';
    weekWrapper.className = 'week dimmed medium';

    // Set content of wrappers.
    // The moment().format("h") method has a bug on the Raspberry Pi.
    // So we need to generate the timestring manually.
    // See issue: https://github.com/MichMich/MagicMirror/issues/181
    let timeString;
    const now = moment();
    if (this._config.timezone) {
      now.tz(this._config.timezone);
    }

    let hourSymbol = 'HH';
    if (this._config.timeFormat !== 24) {
      hourSymbol = 'h';
    }

    if (this._config.clockBold === true) {
      timeString = now.format(hourSymbol + '[<span class="bold">]mm[</span>]');
    } else {
      timeString = now.format(hourSymbol + ':mm');
    }

    if (this._config.showDate) {
      dateWrapper.innerHTML = now.format(this._config.dateFormat);
    }
    if (this._config.showWeek) {
      weekWrapper.innerHTML = now.week();
    }
    timeWrapper.innerHTML = timeString;
    secondsWrapper.innerHTML = now.format('ss');
    if (this._config.showPeriodUpper) {
      periodWrapper.innerHTML = now.format('A');
    } else {
      periodWrapper.innerHTML = now.format('a');
    }
    if (this._config.displaySeconds) {
      timeWrapper.appendChild(secondsWrapper);
    }
    if (this._config.showPeriod && this._config.timeFormat !== 24) {
      timeWrapper.appendChild(periodWrapper);
    }

    function formatTime(config, time): string {
      let formatString = hourSymbol + ':mm';
      if (config.showPeriod && config.timeFormat !== 24) {
        formatString += config.showPeriodUpper ? 'A' : 'a';
      }
      return moment(time).format(formatString);
    }

    /****************************************************************
     * Create wrappers for ANALOG clock, only if specified in this._config
     */

    if (this._config.displayType !== 'digital') {
      // If it isn't 'digital', then an 'analog' clock was also requested

      // Calculate the degree offset for each hand of the clock
      const now = moment();
      if (this._config.timezone) {
        now.tz(this._config.timezone);
      }
      const second = now.seconds() * 6,
        minute = now.minute() * 6 + second / 60,
        hour = ((now.hours() % 12) / 12) * 360 + 90 + minute / 12;

      // Create wrappers
      clockCircle.className = 'clockCircle';
      clockCircle.style.width = this._config.analogSize;
      clockCircle.style.height = this._config.analogSize;

      if (
        this._config.analogFace !== '' &&
        this._config.analogFace !== 'simple' &&
        this._config.analogFace !== 'none'
      ) {
        clockCircle.style.background = 'url(' + './faces/' + this._config.analogFace + '.svg)';
        clockCircle.style.backgroundSize = '100%';

        // The following line solves issue: https://github.com/MichMich/MagicMirror/issues/611
        // clockCircle.style.border = "1px solid black";
        clockCircle.style.border = 'rgba(0, 0, 0, 0.1)'; //Updated fix for Issue 611 where non-black backgrounds are used
      } else if (this._config.analogFace !== 'none') {
        clockCircle.style.border = '2px solid var(--paper-item-icon-color)';
      }
      const clockFace = document.createElement('div');
      clockFace.className = 'clockFace';

      const clockHour = document.createElement('div');
      clockHour.id = 'clockHour';
      clockHour.style.transform = 'rotate(' + hour + 'deg)';
      clockHour.className = 'clockHour';
      const clockMinute = document.createElement('div');
      clockMinute.id = 'clockMinute';
      clockMinute.style.transform = 'rotate(' + minute + 'deg)';
      clockMinute.className = 'clockMinute';

      // Combine analog wrappers
      clockFace.appendChild(clockHour);
      clockFace.appendChild(clockMinute);

      if (this._config.displaySeconds) {
        const clockSecond = document.createElement('div');
        clockSecond.id = 'clockSecond';
        clockSecond.style.transform = 'rotate(' + second + 'deg)';
        clockSecond.className = 'clockSecond';
        clockSecond.style.backgroundColor = this._config.secondsColor;
        clockFace.appendChild(clockSecond);
      }
      clockCircle.appendChild(clockFace);
    }

    /*******************************************
     * Combine wrappers, check for .displayType
     */

    if (this._config.displayType === 'digital') {
      // Display only a digital clock
      wrapper.appendChild(dateWrapper);
      wrapper.appendChild(timeWrapper);
      wrapper.appendChild(weekWrapper);
    } else if (this._config.displayType === 'analog') {
      // Display only an analog clock

      if (this._config.showWeek) {
        weekWrapper.style.paddingBottom = '15px';
      } else {
        dateWrapper.style.paddingBottom = '15px';
      }

      if (this._config.analogShowDate === 'top') {
        wrapper.appendChild(dateWrapper);
        wrapper.appendChild(weekWrapper);
        wrapper.appendChild(clockCircle);
      } else if (this._config.analogShowDate === 'bottom') {
        wrapper.appendChild(clockCircle);
        wrapper.appendChild(dateWrapper);
        wrapper.appendChild(weekWrapper);
      } else {
        wrapper.appendChild(clockCircle);
      }
    } else {
      // Both clocks have been this._configured, check position
      const placement = this._config.analogPlacement;

      const analogWrapper = document.createElement('div');
      analogWrapper.id = 'analog';
      analogWrapper.style.cssFloat = 'none';
      analogWrapper.appendChild(clockCircle);
      const digitalWrapper = document.createElement('div');
      digitalWrapper.id = 'digital';
      digitalWrapper.style.cssFloat = 'none';
      digitalWrapper.appendChild(dateWrapper);
      digitalWrapper.appendChild(timeWrapper);
      digitalWrapper.appendChild(weekWrapper);

      const appendClocks = function(condition, pos1, pos2): void {
        const padding = ['0', '0', '0', '0'];
        padding[placement === condition ? pos1 : pos2] = '20px';
        analogWrapper.style.padding = padding.join(' ');
        if (placement === condition) {
          wrapper.appendChild(analogWrapper);
          wrapper.appendChild(digitalWrapper);
        } else {
          wrapper.appendChild(digitalWrapper);
          wrapper.appendChild(analogWrapper);
        }
      };

      if (placement === 'left' || placement === 'right') {
        digitalWrapper.style.display = 'inline-block';
        digitalWrapper.style.verticalAlign = 'top';
        analogWrapper.style.display = 'inline-block';

        appendClocks('left', 1, 3);
      } else {
        digitalWrapper.style.textAlign = 'center';

        appendClocks('top', 2, 0);
      }
    }

    // Return the wrapper to the dom.
    return wrapper;
  }
}
