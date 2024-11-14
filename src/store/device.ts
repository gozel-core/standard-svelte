import { BROWSER } from "esm-env";
import Bowser from "bowser";
import { writable } from "svelte/store";
import { nanoid } from "nanoid/non-secure";

function createDeviceStore() {
    const browser = Bowser.getParser(
        BROWSER ? window.navigator.userAgent : "gozelbot/0",
    );

    const { subscribe, set, update } = writable({
        platformType: browser.getPlatformType(true),
        browserName: browser.getBrowserName(true),
        browserVersion: browser.getBrowserVersion(),
        isDesktop: isDesktop(),
        isTablet: isTablet(),
        isMobile: isMobile(),
        id: nanoid(24),
    });

    function isDesktop() {
        return browser.getPlatform()?.type === "desktop";
    }

    function isTablet() {
        return browser.getPlatform()?.type === "tablet";
    }

    function isMobile() {
        return browser.getPlatform()?.type === "mobile";
    }

    function isTv() {
        return browser.getPlatform()?.type === "tv";
    }

    function doesSatisfy() {
        return browser.satisfies({
            chrome: ">=1",
            safari: ">=1",
            firefox: ">=1",
            opera: ">=1",
            android: ">=1",
            ie: ">11", // no ie support
            // edge
        });
    }

    return {
        subscribe,
        set,
        update,
        isDesktop,
        isTablet,
        isMobile,
        isTv,
        doesSatisfy,
    };
}

export const device = createDeviceStore();
