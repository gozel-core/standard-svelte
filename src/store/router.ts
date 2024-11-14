import type { ComponentType } from "svelte";
import { writable } from "svelte/store";
import { parse } from "regexparam";
import { BROWSER } from "esm-env";

function createRouterStore() {
    const { subscribe, set, update } = writable({
        isLoading: true,
        current: {
            component: null, //new SvelteComponent({ target: document.createElement('div') }),
            params: [],
            url: new URL("http://localhost"),
            path: "",
        },
        prev: {
            params: [],
            url: new URL("http://localhost"),
            path: "",
        },
    });

    const opts: RouterOpts = {
        preserveScrollOnRouteChange: false,
        isSsr: false,
        isHot: false,
    };

    let isConfigured = false;
    let routeMap: RouteMap = [];
    let fallbackRouteIndex: number;
    let currentRoute: CurrentRoute;
    let prevRoute: PrevRoute;

    function configure(url: URL, routemap: RouteMap, useropts?: RouterOpts) {
        if (useropts) {
            Object.keys(useropts).map((key) => {
                if (Object.hasOwn(opts, key))
                    opts[key as keyof RouterOpts] =
                        useropts[key as keyof RouterOpts];
            });
        }

        if (opts.isHot || opts.isSsr) {
            isConfigured = false;
        }

        if (isConfigured) {
            throw new Error("Router already configured.");
        }

        // sort by depth
        routeMap = routemap.sort((a, b) => {
            const alen = a[0].split("/").length;
            const blen = b[0].split("/").length;
            return alen > blen ? -1 : alen < blen ? 1 : 0;
        });

        // fallback route is a must have
        fallbackRouteIndex = routeMap.findIndex(
            (r) => r.length >= 3 && r[2]!.isFallback,
        );
        if (fallbackRouteIndex === -1) {
            throw new Error("no fallback route found.");
        }

        setCurrentRoute(url, findComponent(url)!);

        if (BROWSER) {
            window.addEventListener("hashchange", () => {
                const u = new URL(window.location.href);
                setCurrentRoute(u, findComponent(u)!);
            });

            window.addEventListener("popstate", (event: PopStateEvent) => {
                const u = new URL(window.location.href);
                setCurrentRoute(u, findComponent(u)!);
                event.preventDefault();
            });
        }

        isConfigured = true;
    }

    function goto(path: string) {
        const url = new URL(path, currentRoute.url);
        setCurrentRoute(url, findComponent(url)!);
    }

    function isPathExists(path: string) {
        return routeMap.some((arr) => arr[0] === path);
    }

    function getRoutePathById(id: string, locale?: string) {
        const route = routeMap.find(
            (r) =>
                r.length >= 3 &&
                Object.hasOwn(r[2]!, "identifier") &&
                r[2]!.identifier === id &&
                (locale ? r[2]?.locale === locale : true),
        );

        if (!route) {
            throw new Error(`Couldn't find route for the id:${id}`);
        }

        return route[0];
    }

    function setCurrentRoute(
        url: URL,
        arr: [string, ComponentType | Promise<ComponentType>, RouteOpts?],
    ) {
        const { keys } = parse(arr[0]);

        if (currentRoute)
            prevRoute = omit(currentRoute, ["component"]) as PrevRoute;

        currentRoute = {
            component: arr[1],
            params: keys,
            url: url,
            path: url.pathname,
        };

        update((v) =>
            Object.assign({}, v, {
                isLoading: false,
                current: currentRoute,
                prev: prevRoute,
            }),
        );

        if (BROWSER) {
            history.pushState(null, "", url);
        }

        if (!opts.preserveScrollOnRouteChange && BROWSER) {
            setTimeout(
                () => window.scrollTo({ top: 0, behavior: "smooth" }),
                300,
            );
        }
    }

    function findComponent(url: URL) {
        const matchedRouteIndex = routeMap.findIndex((r) =>
            doesPathMatch(r[0], url.pathname),
        );
        const currentRouteIndex =
            matchedRouteIndex === -1 ? fallbackRouteIndex : matchedRouteIndex;
        return routeMap[currentRouteIndex];
    }

    function doesPathMatch(pattern: string, path: string): boolean {
        try {
            return parse(pattern).pattern.test(path);
        } catch (e) {
            return false;
        }
    }

    return {
        subscribe,
        set,
        update,
        configure,
        goto,
        getRoutePathById,
        isPathExists,
    };
}

export const router = createRouterStore();

export function link(node: HTMLElement) {
    const href = node.getAttribute("href");
    if (!href || !href.startsWith("/")) {
        return;
    }

    function onClick(event: MouseEvent) {
        const anchor = event.currentTarget as HTMLAnchorElement;

        if (
            (anchor.target === "" || anchor.target === "_self") &&
            shouldNavigate(event) &&
            doesHostMatch(event)
        ) {
            event.preventDefault();
            router.goto(anchor.pathname + anchor.search);
        }
    }

    node.addEventListener("click", onClick);

    return {
        destroy() {
            node.removeEventListener("click", onClick);
        },
    };
}

function shouldNavigate(event: MouseEvent) {
    return (
        !event.defaultPrevented &&
        event.button === 0 &&
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
    );
}

function doesHostMatch(event: MouseEvent) {
    const host = location.host;
    const target = event.currentTarget as HTMLAnchorElement;
    return (
        target.host === host ||
        target.href.indexOf(`https://${host}`) === 0 ||
        target.href.indexOf(`http://${host}`) === 0
    );
}

function omit(object: object, omit: string[]) {
    const _omit = new Set(omit);
    return Object.fromEntries(
        Object.entries(object).filter((e) => !_omit.has(e[0])),
    );
}

export interface RouteOpts {
    isFallback?: boolean;
    identifier?: string;
    locale?: string;
}

export interface RouterOpts {
    preserveScrollOnRouteChange: boolean;
    isSsr: boolean;
    isHot: boolean;
}

export interface CurrentRoute {
    component: ComponentType | Promise<ComponentType>;
    params: string[];
    url: URL;
    path: string;
}

export interface PrevRoute {
    params: string[];
    url: URL;
    path: string;
}

export type RouteMap = [
    string,
    ComponentType | Promise<ComponentType>,
    RouteOpts?,
][];
