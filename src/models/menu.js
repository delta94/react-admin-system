import memoizeOne from "memoize-one";
import isEqual from "lodash/isEqual";
import {formatMessage} from "umi-plugin-react/locale";
import Authorized from "@/utils/Authorized";
import {layout, menu, topNavTheme} from "../../config/defaultSettings";
import {getMenus} from "../services/login";
import {getAuthority, getUser} from "@/utils/authority";
import routeConfig from "../../config/router.config";

const {check} = Authorized;

// Conversion router to menu.
function formatter(data, parentAuthority, parentName) {
  if (!data) {
    return undefined;
  }
  return data
    .map(item => {
      if (!item.name || !item.path) {
        return null;
      }

      let locale = "menu";
      if (parentName && parentName !== "/") {
        locale = `${parentName}.${item.name}`;
      } else {
        locale = `menu.${item.name}`;
      }
      // if enableMenuLocale use item.name,
      // close menu international
      const name = menu.disableLocal
        ? item.name
        : formatMessage({id: locale, defaultMessage: item.name});
      const result = {
        ...item,
        name,
        locale,
        authority: item.authority || parentAuthority
      };
      if (item.routes) {
        const children = formatter(item.routes, item.authority, locale);
        // Reduce memory usage
        result.children = children;
      }
      delete result.routes;
      return result;
    })
    .filter(item => item);
}

const memoizeOneFormatter = memoizeOne(formatter, isEqual);

/**
 * get SubMenu or Item
 */
const getSubMenu = item => {
  // doc: add hideChildrenInMenu
  if (
    item.children &&
    !item.hideChildrenInMenu &&
    item.children.some(child => child.name)
  ) {
    return {
      ...item,
      children: filterMenuData(item.children) // eslint-disable-line
    };
  }
  return item;
};

/**
 * filter menuData
 */
const filterMenuData = menuData => {
  if (!menuData) {
    return [];
  }
  return menuData
    .filter(item => item.name && !item.hideInMenu)
    .map(item => check(item.authority, getSubMenu(item)))
    .filter(item => item);
};
/**
 * 获取面包屑映射
 * @param {Object} menuData 菜单配置
 */
const getBreadcrumbNameMap = menuData => {
  if (!menuData) {
    return {};
  }
  const routerMap = {};

  const flattenMenuData = data => {
    data.forEach(menuItem => {
      if (menuItem.children) {
        flattenMenuData(menuItem.children);
      }
      // Reduce memory usage
      routerMap[menuItem.path] = menuItem;
    });
  };
  flattenMenuData(menuData);
  return routerMap;
};

const memoizeOneGetBreadcrumbNameMap = memoizeOne(
  getBreadcrumbNameMap,
  isEqual
);

const matchSiderMenu = data => {
  let res = null;
  let path = window.location.hash.split("/")[1];
  path = path ? `/${path}` : "";
  data.forEach(item => {
    if (item.path === path) {
      res = item.children;
    }
  });
  if (!res) {
    res = data[0].children || [];
  }
  return res;
};

const updateRouteAuthority = (serverRoutes, routes, auth, ignore) => {
  if (Array.isArray(routes)) {
    routes.forEach(route => {
      let serverItem = serverRoutes.find(item => item.path === route.path);
      serverItem = serverItem || ignore;
      const notAuth = !(
        serverItem ||
        route.path === "/" ||
        route.path === "exception"
      );
      route.authority = notAuth ? "guest" : auth;
      if (route.routes) {
        updateRouteAuthority(
          serverItem.children || [],
          route.routes,
          notAuth ? "guest" : auth,
          true
        );
      }
    });
  }
  return routes;
};

export default {
  namespace: "menu",

  state: {
    menuData: [],
    headerMenuData: [],
    selectedHeaderMenu: "",
    sliderMenuData: [],
    routerData: [],
    breadcrumbNameMap: {}
  },

  effects: {
    * getMenuData({payload}, {put, call}) {
      // 未登录不获取
      const user = getUser();
      if (!user || JSON.stringify(user) === "{}") {
        return;
      }
      const {routes, authority, path} = payload;
      let routerData = routes || routeConfig;

      // 服务端控制菜单及权限
      // const { data: serverRoutes = {} } = yield call(getMenus);
      // routerData = updateRouteAuthority(
      //   serverRoutes,
      //   routerData,
      //   getAuthority(),
      //   false
      // );
      // const originalMenuData = memoizeOneFormatter(
      //   serverRoutes,
      //   authority,
      //   path
      // );

      // 客户端维护菜单及权限
      const originalMenuData = memoizeOneFormatter(routerData, authority, path);

      const menuData = filterMenuData(originalMenuData) || [];
      const breadcrumbNameMap = memoizeOneGetBreadcrumbNameMap(
        originalMenuData
      );

      let headerMenuData = [];
      let sliderMenuData = matchSiderMenu(menuData);

      if (layout === "topmenu") {
        headerMenuData = menuData;
      } else if (!topNavTheme) {
        sliderMenuData = menuData;
      } else {
        headerMenuData = menuData.map(item => {
          return {...item, children: []};
        });
      }

      yield put({
        type: "save",
        payload: {
          menuData,
          breadcrumbNameMap,
          routerData,
          headerMenuData,
          sliderMenuData
        }
      });
    }
  },

  reducers: {
    save(state, action) {
      return {
        ...state,
        ...action.payload
      };
    },
    setHeaderMenu(state, action) {
      const {selectedHeaderMenu} = action.payload;
      const headerMenuData = state.menuData.filter(
        item => item.path === selectedHeaderMenu
      )[0];
      const sliderMenuData = (headerMenuData && headerMenuData.children) || [];
      return {
        ...state,
        selectedHeaderMenu,
        sliderMenuData
      };
    }
  }
};
