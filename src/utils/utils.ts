import { parse, stringify } from 'qs';
import pathRegexp from 'path-to-regexp';
import { history } from 'umi';
import { Route } from '@/models/connect';
import defaultSettings from '../../config/defaultSettings';

declare const ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION: any;

/* 秒格式化：70(s) -> 00:01:10 */
export const formatSeconds = (number: any) => {
  if (!number || Number.isNaN(number as number)) {
    return '00:00:00';
  }
  const secNum = parseInt(number, 10); // don't forget the second param
  let hours: any = Math.floor(secNum / 3600);
  let minutes: any = Math.floor((secNum - hours * 3600) / 60);
  let seconds: any = secNum - hours * 3600 - minutes * 60;

  if (hours < 10) {
    hours = `0${hours}`;
  }
  if (minutes < 10) {
    minutes = `0${minutes}`;
  }
  if (seconds < 10) {
    seconds = `0${seconds}`;
  }
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * number的货币显示法
 * 123456.456123 -> 123,456.45
 */
export const numberFormat = (number: any, long?: number): string => {
  if (number !== 0 && (!number || Number.isNaN(Number(number)))) {
    return '';
  }
  // 指定小数位
  if (long !== undefined) {
    return Number(number)
      .toFixed(long)
      .replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }
  // 有小数
  if (String(number).indexOf('.') > -1) {
    return Number(number)
      .toFixed(2)
      .replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }
  // 无小数
  if (String(number).indexOf('.') === -1) {
    return Number(number)
      .toFixed(1)
      .replace(/\d(?=(\d{3})+\.)/g, '$&,')
      .split('.')[0];
  }
  return number;
};

export const getPageQuery = () => parse(window.location.href.split('?')[1]);

// 下划线转换驼峰
export const toHump = (name: string) => {
  return name.replace(/\_(\w)/g, function (all, letter) {
    return letter.toUpperCase();
  });
};

// 驼峰转换下划线
export const toLine = (name: string) => {
  return name.replace(/([A-Z])/g, '_$1').toLowerCase();
};

/**
 * 排序参数格式化
 * 对象或者对象数组 antd-table内传出的sorter
 * 转字符串 ‘update_at-ascend|name-descend’
 */
export const sortersToString = (sorters: any) => {
  if (!sorters) {
    return undefined;
  }
  const sortersArr: any = Array.isArray(sorters) ? [...sorters] : [sorters];
  sortersArr.map((item: any) => ({ [item.field]: item.order ? item.order : '' }));
  const result: any = [];
  sortersArr.forEach((item: any) => {
    if (item.order) {
      result.push(`${toLine(item.field)}-${item.order}`);
    }
  });
  return result.length > 0 ? result.join('|') : null;
};

/**
 * 排序参数格式化
 * 字符串‘update_at-ascend|name-descend’
 * 转成数组对象
 * [{ field: 'updateAt', order: 'ascend' },
 *  { field: 'name', order: 'descend' }]
 */
export const sortersToObject = (sortersString: any) => {
  if (!sortersString || sortersString === '') {
    return [];
  }
  return sortersString?.split('|').map((item: any) => ({
    field: toHump(item.split('-')[0]),
    order: item.split('-')[1],
  }));
};

// 获取表格列头
export const getColumns = (thead: any, keys: any, ...other: any[]) => {
  const columns =
    thead &&
    thead.map((item: any) => {
      const key = Object.keys(item) && Object.keys(item)[0];
      const value = item[key];
      const newItem = {
        title: value,
        dataIndex: key,
        ...keys[key],
      };
      // title extend
      if (keys[key]?.title) {
        newItem.title = [value, keys[key].title];
      }
      return newItem;
    });
  let result: any[] = [];
  if (columns) {
    result = other && other[0] ? [...columns, ...other] : [...columns];
  } else {
    result = other && other[0] ? [...other] : [];
  }
  return result;
};

// 固化查询参数至url
export const injectURLParams = (pathname: string, newQuery = {}, replace = false) => {
  const query: any = { ...newQuery };
  if (`${query.page}` === '1') {
    delete query.page;
  }
  const routeData = `${pathname}?${stringify(query, { arrayFormat: 'indices' })}`;
  if (replace) {
    history.replace(routeData);
  } else {
    history.push(routeData);
  }
};

// 固化查询参数至url
export const updateURLParams = (params: any, isReplace?: boolean) => {
  const originalParams = isReplace ? {} : getPageQuery();
  injectURLParams(history.location.pathname, { ...originalParams, ...params }, true);
};

// 请求分页参数处理
export const requestPageFormat = (data: any) => {
  const defaultPageSize = 15;
  if (!data) {
    return {
      page: {
        pageNum: '',
        pageSize: defaultPageSize,
        orders: [],
      },
    };
  }
  const newData = { ...data };
  const params: any = {
    page: {
      pageNum: newData.current,
      pageSize: newData.pageSize ?? defaultPageSize,
      orders: [],
    },
  };
  // sort
  if (newData.sort?.length > 0) {
    const sortMap = {
      ascend: 'ASC',
      descend: 'DESC',
    };
    params.page.orders = newData.sort.split('|').map((item: any) => ({
      [item.split('-')[0]]: sortMap[item.split('-')[1]],
    }));
  }
  delete newData?.current;
  delete newData?.pageSize;
  delete newData?.sort;
  return {
    ...newData,
    ...params,
  };
};

// 列表分页参数：数据结构格式化
export const paginationFormat = (data: any): any => {
  const defaultPageSize = 15;
  if (!data) {
    return {
      body: [],
      pagination: {
        currentPage: 1,
        pageSize: defaultPageSize,
        total: 0,
      },
      thead: [],
    };
  }
  return {
    body: Array.isArray(data.body) ? [...data.body] : [],
    pagination: {
      current: data.page ? data.page.pageNum : 1,
      pageSize: data.page ? data.page.pageSize : defaultPageSize,
      total: data.page ? data.page.total : 0,
    },
    thead: [...(data.thead || [])],
    total: data.page ? data.page.total : 0,
  };
};

// 保存用户信息
export const setUserInfo = (data: any) => {
  const { storageName } = defaultSettings;
  if (!window.localStorage) {
    // eslint-disable-next-line no-console
    console.log('浏览器不支持localstorage');
  }
  localStorage.setItem(storageName, JSON.stringify(data));
};

// 获取用户信息
export const getUserInfo = () => {
  if (!window.localStorage) {
    // eslint-disable-next-line no-console
    console.log('浏览器不支持localstorage');
    return {};
  }
  const { storageName } = defaultSettings;
  return JSON.parse(localStorage.getItem(storageName) || '{}');
};

// 更新用户信息
export const updateUserInfo = (key: string, value: any) => {
  const userInfo = getUserInfo();
  if (!userInfo[key]) {
    userInfo[key] = {};
  }
  userInfo[key] = value;
  setUserInfo(userInfo);
};

// 移除用户信息
export const removeUserInfo = () => {
  if (!window.localStorage) {
    // eslint-disable-next-line no-console
    console.log('浏览器不支持localstorage');
  }
  const { storageName } = defaultSettings;
  localStorage.removeItem(storageName);
};

/* eslint no-useless-escape:0 */
const reg = /(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/;

export const isUrl = (path: string): boolean => reg.test(path);

export const isAntDesignPro = (): boolean => {
  if (ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION === 'site') {
    return true;
  }
  return window.location.hostname === 'preview.pro.ant.design';
};

// 给官方演示站点用，用于关闭真实开发环境不需要使用的特性
export const isAntDesignProOrDev = (): boolean => {
  const { NODE_ENV } = process.env;
  if (NODE_ENV === 'development') {
    return true;
  }
  return isAntDesignPro();
};

/**
 * props.route.routes   !!! match childs
 * @param router [{}]
 * @param pathname string
 * @param type
 */
export const getAuthorityFromRouter = <T extends Route>(
  router: T[] = [],
  pathname: string,
  type?: string,
): T | undefined => {
  const authority = router.find(({ routes, path = '/', target = '_self' }) => {
    // match url and children
    const matchChildren = pathRegexp(`${path}/(.*)`).exec(`${pathname}/`);
    // route level
    const level = path.match(/\/[a-zA-Z0-9]+/g)?.length || 1;
    return (
      (path && target !== '_blank' && pathRegexp(path).exec(pathname)) ||
      (type === 'menu' && // 判断菜单权限时：菜单无子路由 - 匹配该路由的所有子路由
        !routes &&
        matchChildren) ||
      (type === 'menu' && // 判断菜单权限时：三级或以上菜单路由 - 匹配该路由的所有子路由
        level >= 3 &&
        matchChildren) ||
      (routes && getAuthorityFromRouter(routes, pathname, type))
    );
  });
  if (authority) return authority;
  return undefined;
};

export const getRouteAuthority = (path: string, routeData: Route[]) => {
  let authorities: string[] | string | undefined;
  routeData.forEach((route) => {
    // match prefix
    if (pathRegexp(`${route.path}/(.*)`).test(`${path}/`)) {
      if (route.authority) {
        authorities = route.authority;
      }
      // exact match
      if (route.path === path) {
        authorities = route.authority || authorities;
      }
      // get children authority recursively
      if (route.routes) {
        authorities = getRouteAuthority(path, route.routes) || authorities;
      }
    }
  });
  return authorities;
};

export const getRouteIcon = (path: string, routeData: Route[]) => {
  let iconDom: any;
  routeData.forEach((route) => {
    if (pathRegexp(`${route.path}/(.*)`).test(`${path}/`)) {
      if (route.icon) {
        iconDom = route.icon;
      }
      if (route.path === path) {
        iconDom = route.icon || iconDom;
      }
      if (route.routes) {
        iconDom = getRouteIcon(path, route.routes) || iconDom;
      }
    }
  });
  return iconDom;
};
