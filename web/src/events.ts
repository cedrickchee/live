import { Socket } from "./socket";
import { UpdateURLParams, GetParams, GetURLParams, Params } from "./params";
import { EventDispatch, LiveEvent } from "./event";

/**
 * Standard event handler class. Clicks, focus and blur.
 */
class LiveHandler {
    constructor(protected event: string, protected attribute: string) {}

    public isWired(element: Element): boolean {
        if (element.hasAttribute(`${this.attribute}-wired`)) {
            return true;
        }
        element.setAttribute(`${this.attribute}-wired`, "");
        return false;
    }

    public attach() {
        document
            .querySelectorAll(`*[${this.attribute}]`)
            .forEach((element: Element) => {
                if (this.isWired(element) == true) {
                    return;
                }
                const params = GetParams(element as HTMLElement);
                element.addEventListener(
                    this.event,
                    this.handler(element as HTMLElement, params)
                );
                element.addEventListener("ack", (_) => {
                    element.classList.remove(`${this.attribute}-loading`);
                });
            });
    }

    protected windowAttach() {
        document
            .querySelectorAll(`*[${this.attribute}]`)
            .forEach((element: Element) => {
                if (this.isWired(element) === true) {
                    return;
                }
                const params = GetParams(element as HTMLElement);
                window.addEventListener(
                    this.event,
                    this.handler(element as HTMLElement, params)
                );
                window.addEventListener("ack", (_) => {
                    element.classList.remove(`${this.attribute}-loading`);
                });
            });
    }

    protected handler(element: HTMLElement, params: Params): EventListener {
        return (_: Event) => {
            const t = element?.getAttribute(this.attribute);
            if (t === null) {
                return;
            }
            element.classList.add(`${this.attribute}-loading`);
            Socket.sendAndTrack(
                new LiveEvent(t, params, LiveEvent.GetID()),
                element
            );
        };
    }
}

/**
 * KeyHandler handle key events.
 */
export class KeyHandler extends LiveHandler {
    protected handler(element: HTMLElement, params: Params): EventListener {
        return (ev: Event) => {
            const ke = ev as KeyboardEvent;
            const t = element?.getAttribute(this.attribute);
            if (t === null) {
                return;
            }
            const filter = element.getAttribute("live-key");
            if (filter !== null) {
                if (ke.key !== filter) {
                    return;
                }
            }
            element.classList.add(`${this.attribute}-loading`);
            const keyData = {
                key: ke.key,
                altKey: ke.altKey,
                ctrlKey: ke.ctrlKey,
                shiftKey: ke.shiftKey,
                metaKey: ke.metaKey,
            };
            Socket.sendAndTrack(
                new LiveEvent(t, { ...params, ...keyData }, LiveEvent.GetID()),
                element
            );
        };
    }
}

/**
 * live-click attribute handling.
 */
class Click extends LiveHandler {
    constructor() {
        super("click", "live-click");
    }
}

/**
 * live-mousedown attribute handling.
 */
class Mousedown extends LiveHandler {
    constructor() {
        super("mousedown", "live-mousedown");
    }
}

/**
 * live-mouseup attribute handling.
 */
class Mouseup extends LiveHandler {
    constructor() {
        super("mouseup", "live-mouseup");
    }
}

/**
 * live-focus event handling.
 */
class Focus extends LiveHandler {
    constructor() {
        super("focus", "live-focus");
    }
}

/**
 * live-blur event handling.
 */
class Blur extends LiveHandler {
    constructor() {
        super("blur", "live-blur");
    }
}

/**
 * live-window-focus event handler.
 */
class WindowFocus extends LiveHandler {
    constructor() {
        super("focus", "live-window-focus");
    }

    public attach() {
        this.windowAttach();
    }
}

/**
 * live-window-blur event handler.
 */
class WindowBlur extends LiveHandler {
    constructor() {
        super("blur", "live-window-blur");
    }

    public attach() {
        this.windowAttach();
    }
}

/**
 * live-keydown event handler.
 */
class Keydown extends KeyHandler {
    constructor() {
        super("keydown", "live-keydown");
    }
}

/**
 * live-keyup event handler.
 */
class Keyup extends KeyHandler {
    constructor() {
        super("keyup", "live-keyup");
    }
}

/**
 * live-window-keydown event handler.
 */
class WindowKeydown extends KeyHandler {
    constructor() {
        super("keydown", "live-window-keydown");
    }

    public attach() {
        this.windowAttach();
    }
}

/**
 * live-window-keyup event handler.
 */
class WindowKeyup extends KeyHandler {
    constructor() {
        super("keyup", "live-window-keyup");
    }

    public attach() {
        this.windowAttach();
    }
}

/**
 * live-change form handler.
 */
class Change {
    protected attribute = "live-change";

    constructor() {}

    public isWired(element: Element): boolean {
        if (element.hasAttribute(`${this.attribute}-wired`)) {
            return true;
        }
        element.setAttribute(`${this.attribute}-wired`, "");
        return false;
    }

    public attach() {
        document
            .querySelectorAll(`form[${this.attribute}]`)
            .forEach((element: Element) => {
                element.addEventListener("ack", (_) => {
                    element.classList.remove(`${this.attribute}-loading`);
                });
                element
                    .querySelectorAll("input,select,textarea")
                    .forEach((childElement: Element) => {
                        if (this.isWired(childElement) == true) {
                            return;
                        }
                        childElement.addEventListener("input", (_) => {
                            this.handler(element as HTMLFormElement);
                        });
                    });
            });
    }

    private handler(element: HTMLFormElement) {
        const t = element?.getAttribute(this.attribute);
        if (t === null) {
            return;
        }
        const formData = new FormData(element);
        const values: { [key: string]: any } = {};
        formData.forEach((value, key) => {
            if (!Reflect.has(values, key)) {
                values[key] = value;
                return;
            }
            if (!Array.isArray(values[key])) {
                values[key] = [values[key]];
            }
            values[key].push(value);
        });
        element.classList.add(`${this.attribute}-loading`);
        Socket.sendAndTrack(
            new LiveEvent(t, values, LiveEvent.GetID()),
            element
        );
    }
}

/**
 * live-submit form handler.
 */
class Submit extends LiveHandler {
    constructor() {
        super("submit", "live-submit");
    }

    protected handler(element: HTMLElement, params: Params): EventListener {
        return (e: Event) => {
            if (e.preventDefault) e.preventDefault();
            var vals = { ...params };

            const t = element?.getAttribute(this.attribute);
            if (t === null) {
                return;
            }
            const data = new FormData(element as HTMLFormElement);
            data.forEach((value: any, name: string) => {
                vals[name] = value;
            });
            element.classList.add(`${this.attribute}-loading`);
            Socket.sendAndTrack(
                new LiveEvent(t, vals, LiveEvent.GetID()),
                element
            );

            return false;
        };
    }
}

/**
 * live-hook event handler.
 */
class Hook extends LiveHandler {
    constructor() {
        super("", "live-hook");
    }

    public attach() {
        document
            .querySelectorAll(`[${this.attribute}]`)
            .forEach((element: Element) => {
                if (this.isWired(element) == true) {
                    return;
                }
                EventDispatch.mounted(element);
            });
    }
}

/**
 * live-patch event handler.
 */
class Patch extends LiveHandler {
    constructor() {
        super("click", "live-patch");
    }

    protected handler(element: HTMLElement, _: Params): EventListener {
        return (e: Event) => {
            if (e.preventDefault) e.preventDefault();
            const path = element.getAttribute("href");
            if (path === null) {
                return;
            }
            UpdateURLParams(path, element);
            return false;
        };
    }
}

/**
 * Handle all events.
 */
export class Events {
    private static clicks: Click;
    private static mousedown: Mousedown;
    private static mouseup: Mouseup;
    private static focus: Focus;
    private static blur: Blur;
    private static windowFocus: WindowFocus;
    private static windowBlur: WindowBlur;
    private static keydown: Keydown;
    private static keyup: Keyup;
    private static windowKeydown: WindowKeydown;
    private static windowKeyup: WindowKeyup;
    private static change: Change;
    private static submit: Submit;
    private static hook: Hook;
    private static patch: Patch;

    /**
     * Initialise all the event wiring.
     */
    public static init() {
        this.clicks = new Click();
        this.mousedown = new Mousedown();
        this.mouseup = new Mouseup();
        this.focus = new Focus();
        this.blur = new Blur();
        this.windowFocus = new WindowFocus();
        this.windowBlur = new WindowBlur();
        this.keydown = new Keydown();
        this.keyup = new Keyup();
        this.windowKeydown = new WindowKeydown();
        this.windowKeyup = new WindowKeyup();
        this.change = new Change();
        this.submit = new Submit();
        this.hook = new Hook();
        this.patch = new Patch();

        this.handleBrowserNav();
    }

    /**
     * Re-attach all events when we have re-rendered.
     */
    public static rewire() {
        this.clicks.attach();
        this.mousedown.attach();
        this.mouseup.attach();
        this.focus.attach();
        this.blur.attach();
        this.windowFocus.attach();
        this.windowBlur.attach();
        this.keydown.attach();
        this.keyup.attach();
        this.windowKeyup.attach();
        this.windowKeydown.attach();
        this.change.attach();
        this.submit.attach();
        this.hook.attach();
        this.patch.attach();
    }

    /**
     * Watch the browser popstate so that we can send a params
     * change event to the server.
     */
    private static handleBrowserNav() {
        window.onpopstate = function (_: any) {
            Socket.send(
                new LiveEvent(
                    "params",
                    GetURLParams(document.location.search),
                    LiveEvent.GetID()
                )
            );
        };
    }
}
