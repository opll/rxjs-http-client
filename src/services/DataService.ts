/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Subject } from 'rxjs';
import { DataSubject } from './DataSubject';
import { HttpClient } from '../http-client/HttpClient';

export interface RequestConfig extends AxiosRequestConfig {
  preventImpersonation?: boolean;
}

interface UpdateProps<U> {
  id?: number | string;
  obj: U;
  config?: RequestConfig;
  fetchAfterUpdate?: boolean;
}

/**
 * Implements DataSubject by adding the CRUD functionality and editable properties for corresponding CRUD-Requests.
 * Additionally, you can react to successfully Create and Update responses by using the onSave-Callback.
 */
export class DataService<T, U = T extends Array<infer Item> ? Item : T> extends DataSubject<T> {
  protected readonly baseUrl: string;

  private _isFetching = false;

  /**
   * @description returns true if the data is fetching from server
   */
  public get isFetching(): boolean {
    return this._isFetching;
  }

  protected set isFetching(value: boolean) {
    this._isFetching = value;
  }

  private _isMutating = false;

  /**
   * @description returns true if any mutation (delete, update, create) is ongoing
   */
  public get isMutating(): boolean {
    return this._isMutating;
  }

  protected set isMutating(value: boolean) {
    this._isMutating = value;
  }

  protected readonly defaultRequestConfig: RequestConfig = {
    preventImpersonation: false,
  };

  private readonly onUpdateSubject: Subject<U> = new Subject<U>();

  constructor(_baseUrl: string, readonly _initValue: T) {
    super(_initValue);
    this.baseUrl = _baseUrl;

    this.onSave = this.onSave.bind(this);
    this.fetch = this.fetch.bind(this);
    this.update = this.update.bind(this);
    this.create = this.create.bind(this);
    this.remove = this.remove.bind(this);
    this.onSaveSuccessful = this.onSaveSuccessful.bind(this);
  }

  /**
   * @description returns the base url (can be overwritten)
   * @protected
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFetchUrl(_arg?: string): string {
    return this.baseUrl;
  }

  /**
   * @description returns the default request config "defaultRequestConfig" (can be overwritten)
   * @protected
   */
  protected getDefaultRequestConfig(): RequestConfig {
    return this.defaultRequestConfig;
  }

  /**
   * @description returns the base url dependent of the given id as parameter (can be overwritten)
   * @param id
   * @protected
   */
  protected getUpdateUrl(id?: number | string): string {
    return id ? `${this.baseUrl}/${id}` : this.baseUrl;
  }

  /**
   * @description returns the base url (can be overwritten)
   * @protected
   */
  protected getCreateUrl(): string {
    return this.baseUrl;
  }

  /**
   * @description receives a callback that will be called when the subject-value is successfully updated or created.
   * @param callback
   */
  public onSave(callback: (data: U) => void) {
    this.onUpdateSubject.subscribe(callback);
  }

  /**
   * @description get new data from backend if not set or forced otherwise use the already stored data in memory
   * @param force
   * @param config
   * @param fetchArg
   */
  public fetch(force = false, config: RequestConfig = {}, fetchArg?: string) {
    if (force || (this.hasInitialValue && !this.isFetching)) {
      this.isFetching = true;
      const reqConfig = { ...this.getDefaultRequestConfig(), ...config } as AxiosRequestConfig;
      HttpClient.get(this.getFetchUrl(fetchArg), reqConfig)
        .then(({ data }) => {
          this.next(this.convertFetchResponse(data));
        })
        .catch(() => this.reset())
        .finally(() => {
          this.isFetching = false;
        });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  protected convertFetchResponse = (data: any): T => {
    return data;
  };

  // eslint-disable-next-line class-methods-use-this
  protected convertUpdateResponse = (data: any): U => {
    return data;
  };

  /**
   * @description update an object and call fetch(force: true) if successfully saved
   * @param id
   * @param obj
   * @param config
   * @param fetchAfterUpdate
   */
  public update({ id, obj, config, fetchAfterUpdate = true }: UpdateProps<U>): Promise<U> {
    this.isMutating = true;
    const reqConfig = { ...this.getDefaultRequestConfig(), ...config } as AxiosRequestConfig;
    return HttpClient.put(this.getUpdateUrl(id), obj, reqConfig)
      .then(result => this.onSaveSuccessful(result, fetchAfterUpdate))
      .finally(() => {
        this.isMutating = false;
      });
  }

  /**
   * @description create a new object and call fetch(force: true) if successfully saved
   * @param obj
   * @param config
   * @param fetchAfterUpdate
   */
  public create(obj: U, config?: RequestConfig, fetchAfterUpdate = true): Promise<U> {
    this.isMutating = true;
    const reqConfig = { ...this.getDefaultRequestConfig(), ...config } as AxiosRequestConfig;
    return HttpClient.post(this.getCreateUrl(), obj, reqConfig)
      .then(result => this.onSaveSuccessful(result, fetchAfterUpdate))
      .finally(() => {
        this.isMutating = false;
      });
  }

  /**
   * @description delete an object and call fetch(force: true) if successfully deleted
   * @param id
   * @param config
   */
  public remove(id: number | string, config?: RequestConfig): Promise<void> {
    this.isMutating = true;
    const reqConfig = { ...this.getDefaultRequestConfig(), ...config } as AxiosRequestConfig;
    return HttpClient.delete(this.getUpdateUrl(id), reqConfig)
      .then(() => this.fetch(true))
      .finally(() => {
        this.isMutating = false;
      });
  }

  /**
   * @description will called by create or update and force a fetch and trigger a onSave event (this.onUpdateSubject.next(data))
   * @param data
   * @param fetchAfterUpdate
   * @private
   */
  private onSaveSuccessful({ data }: AxiosResponse<U>, fetchAfterUpdate: boolean) {
    if (fetchAfterUpdate) {
      this.fetch(true);
    }
    this.onUpdateSubject.next(this.convertUpdateResponse(data));
    return data;
  }
}
