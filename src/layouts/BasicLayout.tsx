/**
 * Ant Design Pro v4 use `@ant-design/pro-layout` to handle Layout.
 * You can view component api by:
 * https://github.com/ant-design/ant-design-pro-layout
 */
import ProLayout, {
    BasicLayoutProps as ProLayoutProps,
    MenuDataItem,
    Settings
} from "@ant-design/pro-layout";
import React, {useEffect} from "react";
import Link from "umi/link";
import {connect} from "dva";
import Authorized from "@/utils/Authorized";
import RightContent from "@/components/GlobalHeader/RightContent";
import {ConnectState, Dispatch} from "@/models/connect";
import logo from "../assets/logo.svg";
import Footer from "./Footer";

export interface BasicLayoutProps extends ProLayoutProps {
    breadcrumbNameMap: {
        [path: string]: MenuDataItem;
    };
    settings: Settings;
    dispatch: Dispatch;
}

export type BasicLayoutContext = { [K in "location"]: BasicLayoutProps[K] } & {
    breadcrumbNameMap: {
        [path: string]: MenuDataItem;
    };
};
/**
 * use Authorized check all menu item
 */

const menuDataRender = (menuList: MenuDataItem[]): MenuDataItem[] =>
    menuList.map(item => {
        const localItem = {
            ...item,
            children: item.children ? menuDataRender(item.children) : []
        };
        return Authorized.check(item.authority, localItem, null) as MenuDataItem;
    });

const footerRender: BasicLayoutProps["footerRender"] = (_, defaultDom) => {
    return (
        <Footer />
    );
};

const BasicLayout: React.FC<BasicLayoutProps> = props => {
    const {dispatch, children, settings} = props;
    /**
     * constructor
     */

    useEffect(() => {
        if (dispatch) {
            dispatch({
                type: "user/fetchCurrent"
            });
            dispatch({
                type: "settings/getSetting"
            });
        }
    }, []);
    /**
     * init variables
     */

    const handleMenuCollapse = (payload: boolean): void =>
        dispatch &&
        dispatch({
            type: "global/changeLayoutCollapsed",
            payload
        });

    return (
        <ProLayout
            logo={logo}
            onCollapse={handleMenuCollapse}
            menuItemRender={(menuItemProps, defaultDom) => {
                if (menuItemProps.isUrl) {
                    return defaultDom;
                }

                return <Link to={menuItemProps.path}>{defaultDom}</Link>;
            }}
            breadcrumbRender={(routers = []) => [
                {
                    path: "/",
                    breadcrumbName: "首页"
                },
                ...routers
            ]}
            itemRender={(route, params, routes, paths) => {
                const first = routes.indexOf(route) === 0;
                return first ? (
                    <Link to={paths.join("/")}>{route.breadcrumbName}</Link>
                ) : (
                    <span>{route.breadcrumbName}</span>
                );
            }}
            footerRender={footerRender}
            menuDataRender={menuDataRender}
            rightContentRender={rightProps => <RightContent {...rightProps} />}
            {...props}
            {...settings}
        >
            {children}
        </ProLayout>
    );
};

export default connect(({global, settings}: ConnectState) => ({
    collapsed: global.collapsed,
    settings
}))(BasicLayout);