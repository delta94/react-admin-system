import { MenuTheme } from 'antd/es/menu/MenuContext';

export type ContentWidth = 'Fluid' | 'Fixed';

export interface DefaultSettings {
  /**
   * theme for nav menu
   */
  navTheme: MenuTheme;
  /**
   * primary color of ant design
   */
  primaryColor: string;
  /**
   * nav menu position: `sidemenu` or `topmenu`
   */
  layout: 'sidemenu' | 'topmenu';
  /**
   * layout of content: `Fluid` or `Fixed`, only works when layout is topmenu
   */
  contentWidth: ContentWidth;
  /**
   * sticky header
   */
  fixedHeader: boolean;
  /**
   * auto hide header
   */
  autoHideHeader: boolean;
  /**
   * sticky siderbar
   */
  fixSiderbar: boolean;
  menu: { locale: boolean };
  title: string;
  pwa: boolean;
  // Your custom iconfont Symbol script Url
  // eg：//at.alicdn.com/t/font_1039637_btcrd5co4w.js
  // 注意：如果需要图标多色，Iconfont 图标项目里要进行批量去色处理
  // Usage: https://github.com/ant-design/ant-design-pro/pull/3517
  iconfontUrl: string;
  colorWeak: boolean;
  storageName: string; // localstorage name
  /*
   * 消息模块:
   * true启用(需要在proxy.config.ts内配置消息服务域名器) false关闭
   */
  notice: boolean;
  /*
   * 帮助文档: 配置帮助文档跳转地址和tooltip文案 {link:'xxx',tooltip:'xxx'}
   */
  helpPage: any;
}

export default {
  navTheme: 'dark',
  primaryColor: '#13c2c2',
  layout: 'sidemenu',
  contentWidth: 'Fluid',
  fixedHeader: false,
  autoHideHeader: false,
  fixSiderbar: false,
  colorWeak: false,
  menu: {
    locale: false,
  },
  title: '后台管理系统',
  pwa: false,
  iconfontUrl: '',
  storageName: 'user',
  notice: true,
  helpPage: {
    tooltip: '帮助文档：跳转google测试',
    link: 'https://google.com',
  },
} as DefaultSettings;
