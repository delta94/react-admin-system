export default [
  {
    path: '/user',
    component: '../layouts/BlankLayout',
    routes: [
      {
        name: '登录',
        path: '/user/login',
        component: './Login',
      },
    ],
  },
  {
    path: '/',
    component: '../layouts/SecurityLayout',
    routes: [
      {
        path: '/',
        component: '../layouts/BasicLayout',
        Routes: ['src/pages/Authorized'],
        routes: [
          {
            path: '/',
            redirect: '/welcome',
          },
          {
            path: '/welcome',
            name: '欢迎页',
            icon: 'smile',
            component: './Welcome',
          },
          {
            path: '/admin',
            name: '管理页',
            icon: 'crown',
            component: './Admin',
            authority: ['admin'],
            routes: [
              {
                path: '/admin/sub-page',
                name: '子页面',
                icon: 'smile',
                component: './Welcome',
                authority: ['admin'],
              },
            ],
          },
          {
            name: '列表查询',
            icon: 'table',
            path: '/list',
            component: './ListTable',
          },
          {
            path: '/exception',
            routes: [
              {
                path: '/exception/403',
                component: './403',
              },
              {
                path: '/exception/404',
                component: './404',
              },
            ],
          },
          {
            component: './404',
          },
        ],
      },
      {
        component: './404',
      },
    ],
  },
  {
    component: './404',
  },
];
