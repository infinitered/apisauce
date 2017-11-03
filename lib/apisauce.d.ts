import {AxiosInstance, AxiosRequestConfig} from 'axios';

export type HEADERS = { [key: string]: string };
export const DEFAULT_HEADERS: {
  Accept: 'application/json',
  'Content-Type': 'application/json'
}

export const NONE: null
export const CLIENT_ERROR: 'CLIENT_ERROR'
export const SERVER_ERROR: 'SERVER_ERROR'
export const TIMEOUT_ERROR: 'TIMEOUT_ERROR'
export const CONNECTION_ERROR: 'CONNECTION_ERROR'
export const NETWORK_ERROR: 'NETWORK_ERROR'
export const UNKNOWN_ERROR: 'UNKNOWN_ERROR'
export const CANCEL_ERROR: 'CANCEL_ERROR'
export type PROBLEM_CODE =
  'CLIENT_ERROR' |
  'SERVER_ERROR' |
  'TIMEOUT_ERROR' |
  'CONNECTION_ERROR' |
  'NETWORK_ERROR' |
  'UNKNOWN_ERROR' |
  'CANCEL_ERROR';

export interface ApisauceConfig extends AxiosRequestConfig {
  baseURL: string;
}

/**
 * Creates a instance of our API using the configuration
 * @param config a configuration object which must have a non-empty 'baseURL' property.
 */
export function create(config: ApisauceConfig): ApisauceInstance;

interface ApiErrorResponse<T> {
  ok: false;
  problem: PROBLEM_CODE;

  data?: T;
  status?: number;
  headers?: {};
  config?: AxiosRequestConfig;
  duration?: number;
}
interface ApiOkResponse<T> {
  ok: true;
  problem: null;

  data?: T;
  status?: number;
  headers?: {};
  config?: AxiosRequestConfig;
  duration?: number;
}
export type ApiResponse<T> = ApiErrorResponse<T> | ApiOkResponse<T>;

export type Monitor = (response: ApiResponse<any>) => void;
export type RequestTransform = (request: AxiosRequestConfig) => void;
export type AsyncRequestTransform = (request: AxiosRequestConfig) => (Promise<void> | ((request: AxiosRequestConfig) => Promise<void>));
export type ResponseTransform = (response: ApiResponse<any>) => void;

export interface ApisauceInstance {
  axiosInstance: AxiosInstance;

  monitors: Monitor;
  addMonitor: (monitor: Monitor) => void;

  requestTransforms: RequestTransform[];
  asyncRequestTransforms: AsyncRequestTransform[];
  responseTransforms: ResponseTransform[];
  addRequestTransform: (transform: RequestTransform) => void;
  addAsyncRequestTransform: (transform: AsyncRequestTransform) => void;
  addResponseTransform: (transform: ResponseTransform) => void;

  headers: HEADERS;
  setHeader: (key: string, value: string) => AxiosInstance;
  setHeaders: (headers: [[string, string]]) => AxiosInstance;
  deleteHeader: (name: string) => AxiosInstance;

  /** Sets a new base URL */
  setBaseURL: (baseUrl: string) => AxiosInstance;
  /** Gets the current base URL used by axios */
  getBaseURL: () => string;

  get: <T>(url: string, params?: {}, axiosConfig?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  delete: <T>(url: string, params?: {}, axiosConfig?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  head: <T>(url: string, params?: {}, axiosConfig?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  post: <T>(url: string, data?: any, axiosConfig?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  put: <T>(url: string, data?: any, axiosConfig?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  patch: <T>(url: string, data?: any, axiosConfig?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  link: <T>(url: string, params?: {}, axiosConfig?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  unlink: <T>(url: string, params?: {}, axiosConfig?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
}

declare const _default: {
  DEFAULT_HEADERS: typeof DEFAULT_HEADERS;
  NONE: typeof NONE;
  CLIENT_ERROR: typeof CLIENT_ERROR;
  SERVER_ERROR: typeof SERVER_ERROR;
  TIMEOUT_ERROR: typeof TIMEOUT_ERROR;
  CONNECTION_ERROR: typeof CONNECTION_ERROR;
  NETWORK_ERROR: typeof NETWORK_ERROR;
  UNKNOWN_ERROR: typeof UNKNOWN_ERROR;
  create: typeof create;
}

export default _default;
