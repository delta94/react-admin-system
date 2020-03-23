/**
 * request 网络请求工具
 * 更详细的 api 文档: https://github.com/umijs/umi-request
 */
import { extend } from 'umi-request';
import { notification, message } from 'antd';
import { getUserInfo } from '@/utils/utils';
import proxyConfig from '../../config/proxy.config';

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

/**
 * 异常处理程序
 */
const errorHandler = (error: { response: Response }): Response => {
  const { response } = error;
  if (response && response.status) {
    const errorText = codeMessage[response.status] || response.statusText;
    const { status, url } = response;

    notification.error({
      message: `请求错误 ${status}: ${url}`,
      description: errorText,
    });
  } else if (!response) {
    notification.error({
      description: '您的网络发生异常，无法连接服务器',
      message: '网络异常',
    });
  }
  return response;
};

/**
 * 配置request请求时的默认参数
 */
const request = extend({
  errorHandler, // 默认错误处理
  // credentials: 'include', // 默认请求是否带上cookie
});

// request interceptor, change url or options.
request.interceptors.request.use((url: string, options: any) => {
  // access check
  const user = getUserInfo();
  const newParams = { ...options.params };
  let newHeaders = { ...options.headers };
  const newData = { ...(options.data || {}) };
  // headers
  if (user && user.token && user.userId) {
    // newParams = { ...options.params, token: user.token };
    newHeaders = { ...options.headers, 'Kdc-Token': user.token, 'User-Id': user.userId };
  }
  // url
  let newUrl = url;
  const isAbsoluteURL = url.substr(0, 4) === 'http';
  // dev remove url-prefix
  if (
    (!isAbsoluteURL && process.env.MOCK === 'none' && process.env.NODE_ENV === 'development') ||
    process.env.NODE_ENV === 'production' ||
    process.env.build_env
  ) {
    newUrl = proxyConfig.postServer + newUrl;
  }
  // login api
  if (options.data && options.data.login) {
    newUrl = proxyConfig.loginServer + url;
    delete newData.login;
  }
  // mock
  if (options.data && options.data.mock) {
    newUrl = url;
    delete newData.mock;
  }
  // proxy match 前端实现生产环境多代理转发配置
  // if (proxyConfig.proxy) {
  //   Object.keys(proxyConfig.proxy).forEach(value => {
  //     if (new RegExp("^" + value, 'g').test(path)) {
  //       url = proxyConfig.proxy[value] + path;
  //     }
  //   })
  // }
  return {
    options: {
      ...options,
      interceptors: options.interceptors,
      headers: newHeaders,
      params: newParams,
      data: newData,
    },
    url: newUrl,
  };
});

// response interceptor, handling response
request.interceptors.response.use(async (response, options: any) => {
  // response.headers.append('interceptors', 'yes yo');
  const res = await response.clone().json();
  if (options.interceptors && res.code && res.code !== 0 && (res.message || res.msg)) {
    message.error(res.message || res.msg);
  }
  return response;
});

export default request;
