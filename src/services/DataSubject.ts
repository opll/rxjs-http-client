/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */
import { BehaviorSubject, Subject } from 'rxjs';

export const ResetSubject = new Subject<boolean>();

/**
 * Implements a BehaviorSubject with an initial value.
 * The DataSubject is resettable (see reset function below).
 * Ensure that the value of all subclasses are reset to the initial value
 * on the user(login) change or on mounting the NGUI App.
 */
export class DataSubject<T> extends BehaviorSubject<T> {
  private _hasInitialValue = true;

  /**
   * @description returns true if the current subject data is the initial value (Decided by the functions next and reset).
   */
  public get hasInitialValue(): boolean {
    return this._hasInitialValue;
  }

  protected set hasInitialValue(value: boolean) {
    this._hasInitialValue = value;
  }

  constructor(protected readonly initValue: T) {
    super(initValue);
    this.subscribeForReset();

    this.next = this.next.bind(this);
    this.reset = this.reset.bind(this);
    this.error = this.error.bind(this);
    this.error = this.error.bind(this);
    this.complete = this.complete.bind(this);
  }

  /**
   * @description reset the stored subject value to the initial one
   */
  public reset() {
    if (!this.hasInitialValue) {
      this._hasInitialValue = true;
    }
    super.next(this.initValue);
  }

  /**
   * @param err
   * @description publish error to all subscribers without closing this BehaviorSubject
   */
  public error(err: any) {
    const { observers } = this;
    const len = observers.length;
    const copy = observers.slice();
    for (let i = 0; i < len; i++) {
      copy[i].error(err);
    }
  }

  public next(value: T): void {
    if (this.hasInitialValue) {
      this._hasInitialValue = false;
    }
    super.next(value);
  }

  /**
   * @description Throw an "Unsupported operation" error (should never used)
   */
  public complete() {
    throw new Error(`Unsupported operation ${this}`);
  }

  /**
   * @private
   * @description reset this subject when any of the eventSubjects
   *  found in getSubjectResetDependingOn is triggered
   */
  protected subscribeForReset() {
    ResetSubject.subscribe(() => this.reset());
  }
}
