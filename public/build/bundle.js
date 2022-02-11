
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* ..\..\..\IamRifki\Code\kaleidovium.github.io\src\components\Layout.svelte generated by Svelte v3.44.0 */
    const file$1 = "..\\..\\..\\IamRifki\\Code\\kaleidovium.github.io\\src\\components\\Layout.svelte";

    function create_fragment$2(ctx) {
    	let div10;
    	let div9;
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let button;
    	let t2;
    	let div8;
    	let div5;
    	let div3;
    	let h1;
    	let t4;
    	let span0;
    	let t6;
    	let div4;
    	let img;
    	let img_src_value;
    	let t7;
    	let span1;
    	let t8;
    	let fieldset;
    	let legend;
    	let t10;
    	let div6;
    	let input;
    	let t11;
    	let label;
    	let t13;
    	let div7;
    	let a0;
    	let t15;
    	let a1;
    	let t17;
    	let a2;
    	let t19;
    	let a3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div9 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(/*parsedUrl*/ ctx[1]);
    			t1 = space();
    			div1 = element("div");
    			button = element("button");
    			t2 = space();
    			div8 = element("div");
    			div5 = element("div");
    			div3 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Kaleidovium";
    			t4 = space();
    			span0 = element("span");
    			span0.textContent = "Formally known as Dania Rifki. Programmer/Artist from Jakarta.";
    			t6 = space();
    			div4 = element("div");
    			img = element("img");
    			t7 = space();
    			span1 = element("span");
    			t8 = space();
    			fieldset = element("fieldset");
    			legend = element("legend");
    			legend.textContent = "Options";
    			t10 = space();
    			div6 = element("div");
    			input = element("input");
    			t11 = space();
    			label = element("label");
    			label.textContent = "Enable Video Drugs";
    			t13 = space();
    			div7 = element("div");
    			a0 = element("a");
    			a0.textContent = "Twitter";
    			t15 = space();
    			a1 = element("a");
    			a1.textContent = "GitHub";
    			t17 = space();
    			a2 = element("a");
    			a2.textContent = "DeviantArt";
    			t19 = space();
    			a3 = element("a");
    			a3.textContent = "YouTube";
    			attr_dev(div0, "class", "title-bar-text");
    			add_location(div0, file$1, 56, 6, 1589);
    			attr_dev(button, "aria-label", "Close");
    			add_location(button, file$1, 60, 8, 1791);
    			attr_dev(div1, "class", "title-bar-controls");
    			add_location(div1, file$1, 57, 6, 1642);
    			attr_dev(div2, "class", "title-bar");
    			add_location(div2, file$1, 55, 4, 1558);
    			attr_dev(h1, "id", "header-name");
    			attr_dev(h1, "class", "svelte-rl2idu");
    			add_location(h1, file$1, 66, 10, 1969);
    			attr_dev(span0, "id", "subheader");
    			attr_dev(span0, "class", "svelte-rl2idu");
    			add_location(span0, file$1, 67, 10, 2018);
    			attr_dev(div3, "class", "col");
    			add_location(div3, file$1, 65, 8, 1940);
    			attr_dev(img, "id", "icon-image");
    			if (!src_url_equal(img.src, img_src_value = "favicon.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "144");
    			attr_dev(img, "height", "144");
    			attr_dev(img, "alt", "Windows 98-styled Icon");
    			attr_dev(img, "class", "svelte-rl2idu");
    			add_location(img, file$1, 72, 10, 2189);
    			attr_dev(div4, "class", "col");
    			add_location(div4, file$1, 71, 8, 2160);
    			attr_dev(div5, "class", "flex-container svelte-rl2idu");
    			add_location(div5, file$1, 64, 6, 1902);
    			set_style(span1, "padding", "0 1rem");
    			add_location(span1, file$1, 81, 6, 2398);
    			attr_dev(legend, "class", "svelte-rl2idu");
    			add_location(legend, file$1, 83, 8, 2458);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "videodrugs-checkbox");
    			attr_dev(input, "class", "svelte-rl2idu");
    			add_location(input, file$1, 85, 10, 2556);
    			attr_dev(label, "for", "videodrugs-checkbox");
    			attr_dev(label, "class", "svelte-rl2idu");
    			add_location(label, file$1, 90, 10, 2701);
    			attr_dev(div6, "class", "field-row svelte-rl2idu");
    			attr_dev(div6, "id", "videodrugs-checkbox-row");
    			add_location(div6, file$1, 84, 8, 2492);
    			attr_dev(a0, "href", "https://twitter.com/kaleidovium");
    			attr_dev(a0, "class", "svelte-rl2idu");
    			add_location(a0, file$1, 93, 10, 2821);
    			attr_dev(a1, "href", "https://github.com/kaleidovium/");
    			attr_dev(a1, "class", "svelte-rl2idu");
    			add_location(a1, file$1, 94, 10, 2886);
    			attr_dev(a2, "href", "https://www.deviantart.com/daniaascii");
    			attr_dev(a2, "class", "svelte-rl2idu");
    			add_location(a2, file$1, 95, 10, 2950);
    			attr_dev(a3, "href", "https://www.youtube.com/c/DaniaRifki/");
    			attr_dev(a3, "class", "svelte-rl2idu");
    			add_location(a3, file$1, 96, 10, 3024);
    			attr_dev(div7, "class", "field-row svelte-rl2idu");
    			add_location(div7, file$1, 92, 8, 2786);
    			attr_dev(fieldset, "class", "svelte-rl2idu");
    			add_location(fieldset, file$1, 82, 6, 2438);
    			attr_dev(div8, "class", "window-body svelte-rl2idu");
    			add_location(div8, file$1, 63, 4, 1869);
    			attr_dev(div9, "class", "window svelte-rl2idu");
    			attr_dev(div9, "id", "main-window");
    			add_location(div9, file$1, 54, 2, 1515);
    			attr_dev(div10, "id", "window-container");
    			attr_dev(div10, "class", "svelte-rl2idu");
    			add_location(div10, file$1, 53, 0, 1484);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div9);
    			append_dev(div9, div2);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, button);
    			append_dev(div9, t2);
    			append_dev(div9, div8);
    			append_dev(div8, div5);
    			append_dev(div5, div3);
    			append_dev(div3, h1);
    			append_dev(div3, t4);
    			append_dev(div3, span0);
    			append_dev(div5, t6);
    			append_dev(div5, div4);
    			append_dev(div4, img);
    			append_dev(div8, t7);
    			append_dev(div8, span1);
    			append_dev(div8, t8);
    			append_dev(div8, fieldset);
    			append_dev(fieldset, legend);
    			append_dev(fieldset, t10);
    			append_dev(fieldset, div6);
    			append_dev(div6, input);
    			input.checked = /*videoDrugsDisable*/ ctx[0];
    			append_dev(div6, t11);
    			append_dev(div6, label);
    			append_dev(fieldset, t13);
    			append_dev(fieldset, div7);
    			append_dev(div7, a0);
    			append_dev(div7, t15);
    			append_dev(div7, a1);
    			append_dev(div7, t17);
    			append_dev(div7, a2);
    			append_dev(div7, t19);
    			append_dev(div7, a3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", close, false, false, false),
    					listen_dev(input, "change", /*input_change_handler*/ ctx[2])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*parsedUrl*/ 2) set_data_dev(t0, /*parsedUrl*/ ctx[1]);

    			if (dirty & /*videoDrugsDisable*/ 1) {
    				input.checked = /*videoDrugsDisable*/ ctx[0];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function close() {
    	document.getElementById("window-container").style.display = "none";
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Layout', slots, []);
    	let { parsedUrl } = $$props;
    	let { videoDrugsDisable } = $$props;

    	// From https://stackoverflow.com/a/41737171
    	// This version doesn't include the Events, but it's fine for here
    	Element.prototype.drag = function (setupParameters) {
    		const setup = setupParameters || {};

    		// document mousemove
    		const mousemove = ({ clientX, clientY }) => {
    			this.style.left = `${clientX - this.dragStartX}px`;
    			this.style.top = `${clientY - this.dragStartY}px`;
    		};

    		// document mouseup
    		const mouseup = e => {
    			document.removeEventListener("mousemove", mousemove);
    			document.removeEventListener("mouseup", mouseup);
    		};

    		const handle = setup.handle || this;

    		// element mousedown
    		handle.addEventListener("mousedown", ({ offsetX, offsetY }) => {
    			this.dragStartX = offsetX;
    			this.dragStartY = offsetY;
    			document.addEventListener("mousemove", mousemove);
    			document.addEventListener("mouseup", mouseup);
    			handle.classList.add("dragging");
    		});

    		handle.classList.add("draggable");
    		this.style.position = "absolute"; // fixed might work as well
    	};

    	onMount(() => {
    		const setup = {
    			handle: document.querySelector(".title-bar")
    		};

    		document.querySelector(".window").drag(setup);
    	});

    	const writable_props = ['parsedUrl', 'videoDrugsDisable'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Layout> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		videoDrugsDisable = this.checked;
    		$$invalidate(0, videoDrugsDisable);
    	}

    	$$self.$$set = $$props => {
    		if ('parsedUrl' in $$props) $$invalidate(1, parsedUrl = $$props.parsedUrl);
    		if ('videoDrugsDisable' in $$props) $$invalidate(0, videoDrugsDisable = $$props.videoDrugsDisable);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		parsedUrl,
    		videoDrugsDisable,
    		close
    	});

    	$$self.$inject_state = $$props => {
    		if ('parsedUrl' in $$props) $$invalidate(1, parsedUrl = $$props.parsedUrl);
    		if ('videoDrugsDisable' in $$props) $$invalidate(0, videoDrugsDisable = $$props.videoDrugsDisable);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [videoDrugsDisable, parsedUrl, input_change_handler];
    }

    class Layout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { parsedUrl: 1, videoDrugsDisable: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layout",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*parsedUrl*/ ctx[1] === undefined && !('parsedUrl' in props)) {
    			console.warn("<Layout> was created without expected prop 'parsedUrl'");
    		}

    		if (/*videoDrugsDisable*/ ctx[0] === undefined && !('videoDrugsDisable' in props)) {
    			console.warn("<Layout> was created without expected prop 'videoDrugsDisable'");
    		}
    	}

    	get parsedUrl() {
    		throw new Error("<Layout>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set parsedUrl(value) {
    		throw new Error("<Layout>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get videoDrugsDisable() {
    		throw new Error("<Layout>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set videoDrugsDisable(value) {
    		throw new Error("<Layout>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var earthboundBattleBackgroundsRollup_umd = createCommonjsModule(function (module, exports) {
    !function(A,g){g(exports);}(commonjsGlobal,(function(A){class g{constructor(A,g){this.colors=null,this.bitsPerPixel=g,this.read(A);}read(A){const g=D(Q(56025+4*A).readInt32()),B=Q(g);this.address=g,this.readPalette(B,this.bitsPerPixel,1);}getColors(A){return this.colors[A]}getColorMatrix(){return this.colors}readPalette(A,g,B){if(2!==this.bitsPerPixel&&4!==this.bitsPerPixel)throw new Error("Palette error: Incorrect color depth specified.");if(B<1)throw new Error("Palette error: Must specify positive number of subpalettes.");this.colors=new Array(B);const w=2**this.bitsPerPixel;for(let g=0;g<B;++g){this.colors[g]=new Array(w);for(let B=0;B<w;B++){const w=A.readDoubleShort(),D=8*(w>>10&31),C=8*(w>>5&31),I=8*(31&w);this.colors[g][B]=255<<24|I<<16|C<<8|D;}}}}class B{static MINIMUM_INDEX=0;static MAXIMUM_INDEX=326;constructor(A=0){this.bbgData=new Int16Array(17),this.read(A);}get graphicsIndex(){return this.bbgData[0]}get paletteIndex(){return this.bbgData[1]}get bitsPerPixel(){return this.bbgData[2]}get paletteCycleType(){return this.bbgData[3]}get paletteCycle1Start(){return this.bbgData[4]}get paletteCycle1End(){return this.bbgData[5]}get paletteCycle2Start(){return this.bbgData[6]}get paletteCycle2End(){return this.bbgData[7]}get paletteCycleSpeed(){return this.bbgData[8]}get horizontalMovement(){return this.bbgData[9]}get verticalMovement(){return this.bbgData[10]}get horizontalAcceleration(){return this.bbgData[11]}get verticalAcceleration(){return this.bbgData[12]}get animation(){return (this.bbgData[13]<<24)+(this.bbgData[14]<<16)+(this.bbgData[15]<<8)+this.bbgData[16]}read(A){const g=Q(56481+17*A);for(let A=0;A<17;++A)this.bbgData[A]=g.readInt16();}static handler(){const A=new Int32Array(114),w=new Int32Array(103);for(let g=B.MINIMUM_INDEX;g<=B.MAXIMUM_INDEX;++g){const D=new B(g);C(D);const I=D.paletteIndex,Q=D.bitsPerPixel;if(A[I]&&A[I]!==Q)throw new Error("BattleBackground palette Error: Inconsistent bit depth");A[I]=Q,w[D.graphicsIndex]=Q;}for(let B=0;B<114;++B)C(new g(B,A[B]));for(let A=0;A<103;++A)C(new P(A,w[A]));}}class w{constructor(A){this.address=A,this.pointer=A;}decompress(){const A=function(A,g){var B=0;let w=A,D=0;for(;255!==g[w];){if(w>=g.length)return -8;let A=g[w]>>5,C=1+(31&g[w]);if(7===A&&(A=(28&g[w])>>2,C=((3&g[w])<<8)+g[w+1]+1,++w),B+C<0)return -1;if(w++,A>=4){if(D=(g[w]<<8)+g[w+1],D<0)return -2;w+=2;}switch(A){case 0:B+=C,w+=C;break;case 1:case 3:B+=C,++w;break;case 2:if(B<0)return -3;B+=2*C,w+=2;break;case 4:if(D<0)return -4;B+=C;break;case 5:if(D<0)return -5;B+=C;break;case 6:if(D-C+1<0)return -6;B+=C;break;default:return -7}}return B}(this.pointer,E);if(A<1)throw new Error(`Invalid compressed data: ${A}`);let g=new Int16Array(A);if(g=function(A,g,B,w){const D=B.length;let C,I=A,Q=0,E=0;for(;255!==g[I];){if(I>=g.length)return null;let A=g[I]>>5,w=1+(31&g[I]);if(7===A&&(A=(28&g[I])>>2,w=((3&g[I])<<8)+g[I+1]+1,++I),Q+w>D||Q+w<0)return null;if(++I,A>=4){if(E=(g[I]<<8)+g[I+1],E>=D||E<0)return null;I+=2;}switch(A){case 0:for(;0!=w--;)B[Q++]=g[I++];break;case 1:for(;0!=w--;)B[Q++]=g[I];++I;break;case 2:if(Q+2*w>D||Q<0)return null;for(;0!=w--;)B[Q++]=g[I],B[Q++]=g[I+1];I+=2;break;case 3:for(C=g[I++];0!=w--;)B[Q++]=C++;break;case 4:if(E+w>D||E<0)return null;for(let A=0;A<w;++A)B[Q++]=B[E+A];break;case 5:if(E+w>D||E<0)return null;for(;0!=w--;)B[Q++]=M.reversedBytes[255&B[E++]];break;case 6:if(E-w+1<0)return null;for(;0!=w--;)B[Q++]=B[E--];break;default:return null}}return B}(this.pointer,E,g),null===g)throw new Error("Computed and actual decompressed sizes do not match.");return g}readInt16(){return E[this.pointer++]}readInt32(){return this.readInt16()+(this.readInt16()<<8)+(this.readInt16()<<16)+(this.readInt16()<<24)}readDoubleShort(){return new Int16Array([this.readInt16()+(this.readInt16()<<8)])[0]}}function D(A,g=!0){let B=A;if(B>=4194304&&B<6291456)B-=0;else {if(!(B>=12582912&&B<16777216))throw new Error(`SNES address out of range: ${B}`);B-=12582912;}return g&&(B+=512),B-655872}function C(A){const g=A.constructor;M.objects.has(g)||M.objects.set(g,[]),M.objects.get(g).push(A);}function I(A,g){return M.objects.get(A)[g]}function Q(A){return new w(A)}let E;class M{static objects=new Map;static layerCache=[];static cached=!1;static reversedBytes=function(){const A=new Int16Array(256);for(let g=0;g<A.length;++g){const B=[...g.toString(2).padStart(8,0)].reverse().join(""),w=Number.parseInt(B,2);A[g]=w;}return A}();constructor(A){M.cached||(E=A,B.handler(),M.cached=!0);}}class H{constructor(A){this.bitsPerPixel=A;}buildTiles(){const A=this.gfxROMGraphics.length/(8*this.bitsPerPixel);this.tiles=[];for(let g=0;g<A;++g){this.tiles.push(new Array(8));const A=8*g*this.bitsPerPixel;for(let B=0;B<8;++B){this.tiles[g][B]=new Array(8);for(let w=0;w<8;++w){let D=0;for(let g=0;g<this.bitsPerPixel;++g){const C=Math.floor(g/2);D+=(this.gfxROMGraphics[A+2*w+(16*C+(1&g))]&1<<7-B)>>7-B<<g;}this.tiles[g][B][w]=D;}}}}draw(A,g,B){const w=A;let D=0,C=0,I=0,Q=0,E=0,M=0,H=!1,P=!1;for(let A=0;A<32;++A)for(let h=0;h<32;++h)Q=32*h+A,E=B[2*Q],M=B[2*Q+1]<<8,D=E+M,C=1023&D,H=0!=(32768&D),P=0!=(16384&D),I=D>>10&7,this.drawTile(w,1024,8*A,8*h,g,C,I,H,P);return w}drawTile(A,g,B,w,D,C,I,Q,E){const M=D.getColors(I);let H,P,h,o,Y,G;for(H=0;H<8;++H)for(h=E?B+7-H:B+H,P=0;P<8;++P)G=M[this.tiles[C][H][P]],o=Q?w+7-P:w+P,Y=4*h+g*o,A[Y+0]=G>>16&255,A[Y+1]=G>>8&255,A[Y+2]=255&G;return A}loadGraphics(A){this.gfxROMGraphics=A.decompress(),this.buildTiles();}}class P{constructor(A,g){this.arrayROMGraphics=null,this.romGraphics=new H(g),this.read(A);}read(A){const g=Q(55201+4*A);this.romGraphics.loadGraphics(Q(D(g.readInt32())));const B=Q(55613+4*A),w=Q(D(B.readInt32()));this.arrayROMGraphics=w.decompress();}draw(A,g){return this.romGraphics.draw(A,g,this.arrayROMGraphics)}}function h(A){return new Int16Array([A])[0]}class o{constructor(A=0){this.data=new Uint8Array(17),this.read(A);}static sanitize(A){return 1!==A&&3!==A?2:A}get type(){return o.sanitize(this.data[2])}set type(A){this.data[2]=o.sanitize(this.data[2]);}get frequency(){return h(this.data[3]+(this.data[4]<<8))}set frequency(A){this.data[3]=A,this.data[4]=A>>8;}get amplitude(){return h(this.data[5]+(this.data[6]<<8))}set amplitude(A){this.data[5]=A,this.data[6]=A>>8;}get compression(){return h(this.data[8]+(this.data[9]<<8))}set compression(A){this.data[8]=A,this.data[9]=A>>8;}get frequencyAcceleration(){return h(this.data[10]+(this.data[11]<<8))}set frequencyAcceleration(A){this.data[10]=A,this.data[11]=A>>8;}get amplitudeAcceleration(){return h(this.data[12]+(this.data[13]<<8))}set amplitudeAcceleration(A){this.data[12]=A,this.data[13]=A>>8;}get speed(){return h(this.data[14])}set speed(A){this.data[14]=A;}get compressionAcceleration(){return h(this.data[15]+(this.data[16]<<8))}set compressionAcceleration(A){this.data[15]=A,this.data[16]=A>>8;}read(A){const g=Q(63240+17*A);for(let A=0;A<17;++A)this.data[A]=g.readInt16();}}let Y=-1;const{PI:G,sin:F,round:c,floor:i}=Math;function f(A,g){return (A%g+g)%g}class e{constructor(A){this.bitmap=A,this.C1=1/512,this.C2=8*G/262144,this.C3=G/60;}setOffsetConstants(A,g){const{amplitude:B,amplitudeAcceleration:w,compression:D,compressionAcceleration:C,frequency:I,frequencyAcceleration:Q,speed:E}=g,M=2*A;this.amplitude=this.C1*(B+w*M),this.frequency=this.C2*(I+Q*M),this.compression=1+(D+C*M)/256,this.speed=this.C3*E*A,this.S=A=>c(this.amplitude*F(this.frequency*A+this.speed));}overlayFrame(A,g,B,w,D){return this.computeFrame(A,this.bitmap,g,B,w,D,this.effect)}getAppliedOffset(A,g){const B=this.S(A);switch(g){default:return B;case 2:return A%2==0?-B:B;case 3:return f(i(B+A*this.compression),256)}}computeFrame(A,g,B,w,D,C,I){const{type:Q}=I,E=A,M=g;let H,P,h,o,Y;for(this.setOffsetConstants(w,I),P=0;P<224;++P){const A=this.getAppliedOffset(P,Q),g=3===Q?A:P;for(H=0;H<256;++H)h=4*H+1024*P,P<B||P>224-B?(E[h+0]=0,E[h+1]=0,E[h+2]=0,E[h+3]=255):(Y=H,1!==Q&&2!==Q||(Y=f(H+A,256)),o=4*Y+1024*g,C?(E[h+0]=D*M[o+0],E[h+1]=D*M[o+1],E[h+2]=D*M[o+2],E[h+3]=255):(E[h+0]+=D*M[o+0],E[h+1]+=D*M[o+1],E[h+2]+=D*M[o+2],E[h+3]=255));}return E}}class O{constructor({background:A,palette:g}){this.type=A.paletteCycleType,this.start1=A.paletteCycle1Start,this.end1=A.paletteCycle1End,this.start2=A.paletteCycle2Start,this.end2=A.paletteCycle2End,this.speed=A.paletteCycleSpeed/2,this.cycleCountdown=this.speed,this.cycleCount=0,this.originalColors=g.getColorMatrix(),this.nowColors=[];for(let A=0;A<this.originalColors.length;++A){this.nowColors[A]=[];for(let g=16;g<32;++g)this.originalColors[A][g]=this.originalColors[A][g-16],this.nowColors[A][g-16]=this.originalColors[A][g];}}getEffect(){return this.type}getColors(A){return this.nowColors[A]}cycle(){return 0!==this.speed&&(--this.cycleCountdown,this.cycleCountdown<=0&&(this.cycleColors(),++this.cycleCount,this.cycleCountdown=this.speed,!0))}cycleColors(){if(1===this.type||2===this.type){const A=this.end1-this.start1+1,g=this.cycleCount%A;for(let B=0;B<this.originalColors.length;++B)for(let w=this.start1;w<=this.end1;++w){let D=w-g;D<this.start1&&(D+=A),this.nowColors[B][w]=this.originalColors[B][D];}}if(2===this.type){const A=this.end2-this.start2+1,g=this.cycleCount%A;for(let B=0;B<this.originalColors.length;++B)for(let w=this.start2;w<=this.end2;++w){let D=w-g;D<this.start2&&(D+=A),this.nowColors[B][w]=this.originalColors[B][D];}}if(3===this.type){const A=this.end1-this.start1+1,g=this.cycleCount%(2*A);for(let A=0;A<this.originalColors.length;++A)for(let B=this.start1;B<=this.end1;++B){let w=B+g,D=0;w>this.end1&&(D=w-this.end1-1,w=this.end1-D,w<this.start1&&(D=this.start1-w-1,w=this.start1+D)),this.nowColors[A][B]=this.originalColors[A][w];}}}}const[s,J]=[256,256];var K=function(A){const g=window.atob(A),B=new Uint8Array(g.length);for(let A=0;A<g.length;++A)B[A]=g.charCodeAt(A);return B.buffer}("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IAbEAC8AAYQAzwADhgL1AA6FBj2GAGkBAyCFBWIAC4QAGQYBIAagAKAExgRlgwAKAQqggwMShwUMAAyEAJkAAYMD8YYAqQAHyAZ5AQWgxQZuAAaEBjkCDSAKhABJAAaEA1EAA4MHC4gDdQENIMcBUgMAIAkghQXiAAeEAJkADcQAe4QFQgOgDaAMhACbgwOSAgcgDYYCg8QEkgGgAYYGUQMOIAWghQYiAgkgDMYF7wANhAE/AwYgASCFANoACcQD1QIKoA6GAaeEBrLGAS0CBCAChgZhAAWDATOGA9ODAYD/L/9HA/wLD/Mf5z/Hf4//H/9/Iv9D/wAI/wH+D/D/Af8PRQD/Qf8AQwP8Qgf5CA/zD/8//3//fyj/BAP8gf6AQf/AAf/gpAAo/z8A/5fYywDUpcsAbLHLAPOeywDlccsA453LAPqfywBBtMsAr3XLAMdPywAkkcsABMvLABzXywB4ycsAALjLAKuPywB7fssAAKHLABduywBuxssAL7rLAL3GywCbx8sALMPLAMusywDLc8sALcrLAKubywBnyssA0svLAAXXywDBxcsAfb/LAJ7KywCawcsAtsnLAI64ywAUc8oA02XKAE+LygD5qMoAX5bKACNXygBsf8oA7dbLADTLywCHy8sACZTLALTWywAu18sA0tbLAF7AywAymcsAzIHLAB6rywBwyMsAVdfKAK/LywBey8sAU8fLAA9IygAtOMoASaDKAAAAygBCIMoAPLvLAFu3ygA918sARqrLADrJywDNtssAlNjLAJHYywAq2MsAjtjLAIvYywCI2MsAhdjLANTKywCC2MsAf9jLAHzYywCakssAedjLAB9DywDrpMsApRbLAHbYywAYxssApafLAJ7XygBnt8sAtsjLAImoywAqyMsA88nLAPvIywDjx8sAyJzLAPWrywDJwssArbDLAKq9ywBx2MsAnYnLAGxVywAqsssAj0nLABFkywDBP8sAs0zLAJ5SywCjMcsACCXLAGjFywABhcsALbbLAL2mywAAossAhC3LAGXCywC3ussAj8PLALm8ywAPxcsAssTLAKW5ywA9vMsAAMLLAMw4ywDtr8sA+qPLADPBywAyvcsAaqnLAMC7ywBTxMsAXZXLACiAywDJfMsAkrDKAB6+ygChxMoAWCnLAJULywAJy8oAAADLAKyWywCTs8sA8sPLAGyuywAKv8sAjIbLAHGaywAnXcsA/2/LANJhywCNtcsALa/LACtmywCXvssAGrnLAD1qywDyBcsAEBzLACERywCfIMsAkV/LAJytywBZPMsAysDLAP+iywDttMsA4bLLAGzYywBn2MsAYtjLAF3YywBY2MsAU9jLAE7YywAqjssASdjLAETYywA/2MsAaoPLADrYywAoWMsAFojLAKhaywA12MsAIb7LACtsywAw2MsA7r/LAAvHywA/aMsAT3nLAIF3ywCojMsAPzXLAGZGywAki8sASdHKABJ7ywDwl8sAItjLAJTWywB01ssAVNbLADTWywAU1ssA9NXLANTVywC01csAlNXLAHTVywBU1csANNXLABTVywD01MsA1NTLALTUywCU1MsAdNTLAFTUywA01MsAFNTLABrYywD008sA1NPLALTTywCU08sAdNPLAFTTywA008sAFNPLAPTSywDU0ssAtNLLAJTSywB00ssAVNLLADTSywAU0ssA9NHLANTRywC00csAlNHLAHTRywBU0csANNHLABTRywD00MsA1NDLALTQywCU0MsAdNDLAFTQywA00MsAFNDLAPTPywAS2MsACtjLAALYywD618sA8tfLAOrXywDi18sA2tfLANLXywDK18sAwtfLALrXywCy18sAqtfLANTPywCi18sAmtfLALTPywCS18sAitfLAILXywCUz8sAetfLAHTPywBy18sAatfLAFTPywA0z8sAFM/LAPTOywDUzssAtM7LAJTOywB0zssAVM7LADTOywAUzssA9M3LAGLXywBa18sA1M3LALTNywCUzcsAdM3LAFTNywA0zcsAUtfLABTNywD0zMsA1MzLALTMywCUzMsAStfLAHTMywBUzMsANMzLABTMywD0y8sAAAACAwEDAAAeAAAAAAAAAAABAQQDAg8AAAhMAAAAPAAAAAECBAECDwAAB0wAAAA9AAAAAgMEAwIPAAAIAAAAAC8AAAADAgQBAg8AAAVMAAAAKwAAAAQEBAECDwAACEZHAABJAAAABAQEAQIPAAAIRkcAAEkAAAAEBAQBAg8AAAhGRwAASwAAAAQEBAECDwAACEZHAABJAAAABQUEAwEPAAAITAAAAAcAAAABBgQBAQ8AAAhMAAAAGgAAAAYHBAMCDwAABk0AAAAHAAAABwYEAQEPAAAITQAAAAgA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AAAA/wAAAAAAAAAAAAEAAAAAAAAAAAAAAAEAAAAAAAAAAAD/AAAAAAAAAAEA/wAAAAAAAAABAAEAAAAAAAAA/wABAAAAAAAAAP8A/wAAAAAAAIAAAP8AAAAAAAAAAYD/AAAAAAAAAAGAAAAAAAAAAIAAAAEAAAAAAACA/wABAAAAAAAAAP+AAAAAAAAAAAD/gP8AAAAAAACA/wD/AAAAAAAAgP8AAAAAAAAAAIAAAAAAAAAAAAAAAIAAAAAAAAAAAACA/wAAAAAAAIAAgP8AAAAAAACAAIAAAAAAAAAAgP+AAAAAAAAAAID/gP8AAAAAAABAAID/AAAAAAAAgADA/wAAAAAAAIAAQAAAAAAAAABAAIAAAAAAAAAAwP+AAAAAAAAAAID/QAAAAAAAAACA/8D/AAAAAAAAwP+A/wAAAAAAAMD/AAAAAAAAAABAAAAAAAAAAAAAAABAAAAAAAAAAAAAwP8AAAAAAABAAMD/AAAAAAAAQABAAAAAAAAAAMD/QAAAAAAAAADA/8D/AAAAAAAAIADA/wAAAAAAAEAA4P8AAAAAAABAACAAAAAAAAAAIABAAAAAAAAAAOD/QAAAAAAAAADA/yAAAAAAAAAAwP/g/wAAAAAAAOD/wP8AAAAAeAB4AAAA//8AAHgAiP8AAAEAAAA8AMT/xP8BAAEAPAA8AMT///8BAPAAAAAAAAEAAADwAPAAAAD//wAA4AEAAAAAAQAAAOAB4AEAAP//AAAFAAACAAAAAAAABQAA/gAAAAAAAAUAAAAAAgAAAAAFAAAAAP4AAAAABQAABAAAAAAAAAUAAPwAAAAAAAAFAAAAAAQAAAAABQAAAAD8AAAAAFoAgAAgAP//AABaAID/IAABAAAAeAAAAAABAAD+/3gAAAAQAAAAAgA8AGAAIAAAAAAAPABgAOD/AAAAAHgAgP+A/wAAAAB4AMD/wP8AAAAAgAAAAQAB/////4AAgACA/wEA//+AAAD/AP8BAAEAgACA/4AA//8BAIAAAABAAAAAAACAAAAAwP8AAAAAAAEQAEAAAAAAAAAB8P/A/wAAAACAByAAAAAAAAAAgAcAAOD/AAAAAIAH4P8AAAAAAACABwAAIAAAAAAAPAAAADwAAAD//zwAAAAAAAAAAQAAAQAEAAD8/wAAAAIAAAAAAgAAAHgAAAAAAAAAAAAAAEAAgAAAAAAA0AIAAAAAAQABANAC0ALQAv/////QAgAAAAD//wEA0AIw/dACAQD//2QGQADA/wAAAABDA0AAQAAAAAAAQwPA/0AAAAAAALAEwP/A/wAAAACAB4AAAAAAAAAAgAcAAID/AAAAAIAHgP8AAAAAAACABwAAgAAAAAAAtABgACAAAAAAALQAYADg/wAAAAD0AQAAAAABAAAA9AH0AQAA//8AAJABAAAAAAEAAQCQAZABkAH/////kAEAAAAA//8BAJABcP6QAQEA///wAID/gAAAAAAAtACAAIAAAAAAAPAAgACA/wAAAAC0AID/gP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEABAAIAAAAAAAAAAIAAAAAAQAEABAAAAAAAAAAAgAAAAABAAQAIAAAAAAAAAACAAAAAAEABABAAAAAAAAAAAIAAAAAAQADAAgAAAAAAAAAAgAAAAABAAMAEAAAAAAAAAACAAAAAAEAAwAgAAAAAAAAAAIAAAAAAQADAEAAAAAAAAAAAgAAAAABAAIACAAAAAAAAAACAAAAAAEAAgAQAAAAAAAAAAIAAAAAAQACACAAAAAAAAAAAgAAAAABAAIAQAAAAAAAAAACAAAAAAEAAQAIAAAAAAAAAAIAAAAAAQABABAAAAAAAAAAAgAAAAABAAEAIAAAAAAAAAACAAAAAAEAAQBAAAAAAAAAAAIAAAAAAQAEAIAAAAAAAAAAAgAAAAABAAIAgAAAAAAAAAACAAAAAAEAAv//AAAAAAAAAAIAAAAAAgAEAAgAAAAAAAAAAgAAAAACAAQAEAAAAAAAAAACAAAAAAIABAAgAAAAAAAAAAIAAAAAAgAEAEAAAAAAAAAAAgAAAAACAAMACAAAAAAAAAACAAAAAAIAAwAQAAAAAAAAAAIAAAAAAgADACAAAAAAAAAAAgAAAAACAAMAQAAAAAAAAAACAAAAAAIAAgAIAAAAAAAAAAIAAAAAAgACABAAAAAAAAAAAgAAAAACAAIAIAAAAAAAAAACAAAAAAIAAgBAAAAAAAAAAAIAAAAAAgABAAgAAAAAAAAAAgAAAAACAAEAEAAAAAAAAAACAAAAAAIAAQAgAAAAAAAAAAIAAAAAAgABAEAAAAAAAAAAAgAAAAACAAQAgAAAAAAAAAACAAAAAAIAAgCAAAAAAAAAAAIAAAAAAgAC//8AAAAAAAAAAgAAAAADAAQACAAAAAAAAAACAAAAAAMABAAQAAAAAAAAAAIAAAAAAwAEACAAAAAAAAAAAgAAAAADAAQAQAAAAAAAAAACAAAAAAMAAwAIAAAAAAAAAAIAAAAAAwADABAAAAAAAAAAAgAAAAADAAMAIAAAAAAAAAACAAAAAAMAAwBAAAAAAAAAAAIAAAAAAwACAAgAAAAAAAAAAgAAAAADAAIAEAAAAAAAAAACAAAAAAMAAgAgAAAAAAAAAAIAAAAAAwACAEAAAAAAAAAAAgAAAAADAAEACAAAAAAAAAACAAAAAAMAAQAQAAAAAAAAAAIAAAAAAwABACAAAAAAAAAAAgAAAAADAAEAQAAAAAAAAAACAAAAAAMABACAAAAAAAAAAAIAAAAAAwACAIAAAAAAAAAAAgAAAAADAAL//wAAAAAAAAACAAAAAAQABAAIAAAAAAAAAAIAAAAABAAEABAAAAAAAAAAAgAAAAAEAAQAIAAAAAAAAAACAAAAAAQABABAAAAAAAAAAAIAAAAABAADAAgAAAAAAAAAAgAAAAAEAAMAEAAAAAAAAAACAAAAAAQAAwAgAAAAAAAAAAIAAAAABAADAEAAAAAAAAAAAgAAAAAEAAIACAAAAAAAAAACAAAAAAQAAgAQAAAAAAAAAAIAAAAABAACACAAAAAAAAAAAgAAAAAEAAIAQAAAAAAAAAACAAAAAAQAAQAIAAAAAAAAAAIAAAAABAABABAAAAAAAAAAAgAAAAAEAAEAIAAAAAAAAAACAAAAAAQAAQBAAAAAAAAAAAIAAAAABAAEAIAAAAAAAAAAAgAAAAAEAAIAgAAAAAAAAAACAAAAAAQAAv//AAAAAAAAAAIAAHgABAACACAAAAAAAAABCgAAeAABAAIAIAAAAAAAAAEKAAB4AAIAAgAgAAAAAAAAAQoAAHgAAwACACAAAAAAAAABCgAA/wADAAIAAAAAAAAAAAEAAAD/AAMAAgD/AAAAAAAA/wAAAP8AAQACAAAAAAAAAAABAAAA/wABAAIA/wAAAAAAAP8AAAAAAAMAAgCAAAACAAAAAAAAAAAAAwACAIAAgAAAAAAAAAAAAAEDAAQAQAAAAQAAAAAAAgAAAQMABABAAAADAAAAAAD+/wAEAQAIAECAAAD+/wAAAQAAAAQBAAAAQIAAAAIAAAD/AABYAgMAAAAAAAABAAAAAAADAFgCAwAAAAAACAgAAAAAAP3/AAIDAAAAAAAAAgAAAAAA//8AAgMAAAAAAAAAAAAAAAABAPAAAwAAAAAA4AIAAAAAAP7/8AADAAAAAAAAAAAAAAAAAgDwAAEABACAAQAA/v+c/wEAAPAAASACQCLxAAACAGQA/wAAAAEEAAIAQAIAAQIAAAABAgAAAQQABABAAgAD/v8AAP/+/wAAAYAAAAgBAAAAAAAAAAAAAAEBAAQAAAIAAAAAgAAAAAAAAQEABACAAgAAAACA/wAAAPQBAQACAAACAAAAAIAAAAAA9AEBAAIA+gIAAAAAgP8AAAD0AQEAAgAACgAAAABQAAAAAPQBAQACQJwKAAAAALD/AAAA8AADAAIACAIAAAAAAAAAAQDgAQMAAgAIAgDwAAAAAAD+//AAAQAAAAAAAAAAAAAAAAAAtAABAAAAAAAAAAAAAAAAAABoAQEAAQAAAgAAAACAAAAAAGgBAQABAAACAAAAAEAAAAAAAAACABCA+goAAAAAAAAAAADgAQIAAgAQAAAAAAAAAAIAAPAAAQACABAAAAAAAAAAAgAAAAAD4AAAEAAAAAAAAAACAAAAAQMABAAAAgAAAACAAAAAAAABAwAEAIACAAAAAID/AAAA4AEDAAIABAIAAQAAAAAAAgDgAQMAAgAEAsAEAAAAAAD+/wAAAwADAEAAAAAAAAAAAgAAAAADAAQAIAAAAAAAAAACAAAAAQMABAAAAgAAAACAAAAAAAABAwAEAIACAAAAAID/AAAAAAEDAAQAAAIAAAAAlgAAAAAAAQMABACWAgAAAABq/wAAAGgBBAABAAAAAAAAADwAAgAAaAEEAAFgVAAAAAAAxP8CAAAAAAMAAQAEAAAAAAAAAAIAAPAABAABAAAAAAAAAFoAAgAA8AAEAAFgVAAAAAAApv8CAAD+AQMAAgAAAAAAAACAAAAAAP4BAwACAP8AAAAAAID/AAAAAEQAIAkBIAKgAyAEIAVgRgAgEQagByAIYAlgCiALYAxgDaAO4EoAIAQPoBAgEUEgBwcgEmATIBQgFYgAEw0MoBagF6AYYBngGqAbYEsAIBAcIB2gByAe4B+gIOAhoCIgI44AMwYkoCWgJmAnlgAzFBwgKOAAICmgKmArICygLeAu4C9gMIoAEwYxYDJgACAziAAzAjQgNYoAEwI2IDeEADMOKCA44DlgOiA7YDwgPeA+igAzCD+gQKBBYEKgKIYAEwRDoETgRYgAEwNGIEdggwEMDkigSSBK4EugTCBNYE4gT4QAEw5QIFFgUmAAIFMgVOAAIFWGAS8GVqBXYFigWYQAE+AwWiBb4FwgXaBe4F8gYOBhYGLgY+BkoGWgZmAAIDAgZyBooGlgACBqIGugbGBtIG6gb4QAEwRwoHHgcoQAM+AwcyB0YHXgdiB3IHjgeWB64HtgACB8oH3gfuAAIH+ggKCB4IJggyCEYIUghuCHIIjgiYQA2wKKoIuGADMZjKCNII7gjyCQoJHgkqCToJTglWCWIJdgmCCDANwUMKCZ4Jqgm+CUoJzgACCdoDpgniCfjAAT4CagIKHgoiCjoKQgpeAAIKagp2Co4KngqqCrYKxgraCuYAAgr+CwoLGEADMGMCCy4LOgtIwAE+A0tSC24LcguOC5oLpguyC8IL3gvqC/4MAgweDC4MOgxCDFYMagx+DIYMkgyiDLIMxgzaDOYM+IABPgNtAgByBa4NEgWiDSINNg1ODVYNZgACDXYNjg2aDaYAAg2+DcYKpgwCDd4N6g3yDgYOGg4iDj4OSIADPgMeWg5qAAIOfg6KDpoOqg66Ds4DDg7SDu4O/gACDwIPEgACDyIPNg9CD1YPag9+D44PmgTgAgF/rgACD74FbgACD8oP0g/mD/YADhAeEk4FQAIBswIAIhAyEEIf+gBaH94PxgACAGIQdhACAIYZlgTAAg4CcwIAlhCiELIQxhDaH0IPOg8uAAIPHg8OAAIA6hD6EQoTAg7CDrYBHhQwAgBRJhE2EUIUIAIOAqFSEWIRfh4WDgoN/g3mDdIMDgqqDcoNsgACDaoNlgGCEZ4QAg1qDVoNQgGoYD8cMCxgIb4RyGA/8BHaHEArYUoMvgyuDJ4MigxyDGYMWgxODDYB4hxAKcCSC+YL0gvOC74B+GA/EGtiC14CAhIYYD8QgioSPhs2CyIDCEADMYsSCwYK8gACCuoCRhrKCrYKpgqSCoIKegpoQAEwwlISZhACChIKDgJyEohgPxFSkhKuGe4DqgnWAAIJwglGCbIJpgmSCFANwSmOCXoJbglaCUICvhLGEtYS4hWcMCCRLgjGAvoTDhACCLIDEhByAy4YmgxgHy4FPghKCD4IKggSCAYDNhACB+IH0gfGAAIDShhaA1ITahN+EAIHUgdKBz4DghOeEAIDqhO6EHINJgPOFuYG3gbKBrYGrgACBpoGhgZ+DW4AAgZqBlYGSEABMJPaFs4AAgXiBdYMQBiAPgPiFThAAzDz+hQKEHIEHhKKBVYAAgVCCDBX4EUqBRoEKEA/EOT6BO4EOhMGBEIUVhRmFVhADJBkegRuBHIUiGA/EESaFKoUuEA/HGATABYD+KABMMPiA9IDzgO6A64DmgOIQAyQcAIDcgNuBM4UQAIAJNoRyGAS8GMyAAIDKgMYoDMw4woC+gLiAtICxgK+AqoCmEAUkAHJIAMwocoE5hJyAmoCVgJI4AExAjICLgIWAgIB9gHiAHIB1gHJYAMw5PoVChGmAZIBigF2AWYAyIABMHFaAU4BPgEqDEAFID4BDgD5YAcREOIA1gDKALoArgCaAIoAcgUWFGACAIBaAE4APgAmABmANpD1KhU2FUYVWhVmFXYVjhWeFGACAHWqFbYVwhXeFNACAMLaFeoV/hACBgoWGhYpAHMwJj4TKeA2kDMiBjIUMAIBVkIWUhZiEAIGIhYWFgYQAgXyFeYS1hTQAgBl0hXOFboVqGBt0DZ6Fo4UFpoQVqIVghV6HEBxYDoVOhUowG3f/gXADgAWACIAMgBOAFoAZgB2AIIAkgCiAL4AygDWAOYA8gD2AOIA0gDOALoApgCWAIYAcgBiAF4ASgA2ACYAEgAKAQYBEgEuATYBSgFSAWYBdgGCAZ4BqgGyAcIB2gHkFgH+A+IB4gHeAcYBtgGuAZoBhgFyAWIBVgFOATIBKgEWAQICDgIWAi4COgJCAlICZgJyAoIClgKiAroCygLaAu4C+gxACeBOAs4CvgxACUAGDEAI7gQGAkYCPgIqAhICCgMKAx4DKgM+A0oDWgNiA3IDhgOeA6YDsgPKA94D4gP2A/ID5gPaA84DtgOiA5oDggN2A2YDXgyADI4CTgQKBBoEJgQ6BEIEUgRuBHIEjgSWBKoEsgTGBNIE4gT+BPoE5gxAEa4DRgSuBJIEigR2BGoEVgRGBD4EIgQeBA4FBgUeBSoFPgVCBV4FYgV6BYoFngWiBb4FzgXeBe4EFfIBVeoF2gXKBboFpgWaBY4FfgVmBVoFRgxAFGGqBQIGCgYWBiIGMgZKBloGYgZyBoIGmgaqBrYEdfIOAtayBq4GngaGBnYGZgZeBk4GNgYmBhIGDgbOBtoG6gb6BwIHFgcuBzoHRgdaB24ElfIOApdqB14HQgc+ByoHEgcGBv4G7gbeBsoHcgeCB5YHqge6B8YH0gfiB/4IDgS18g4CeAoH+gfmB9YHwge+B64HkgeGB3YIGggqCDoITghWCG4IegiOCJYIpgS18gA4ogiSDEAk4doIUghKCD4ILggeCLYIzgjaCO4I+gkGCRIJLgk+CUmAITCZSgk6CSoJFgkCDGAogUoIsglSCWYJcgmCCZYJogm2CcIJ1gTV8gygLQAGDEAsQSYJWgluCXoJigmeCaoJvgnKCd4E1fIMoDEADgxAMEE+CL4IxgjSCOYI8gkOCRoJJgk2CUmAJTCZQgkyCSIJHgkKDGA0gVIIuggSCCIIMghGCF4IZghyCIYIngipgCEwOKoImgxAOOHSCFoIQgg2CCYIFgd6B4oHngeiB7IHzgfaB+oH9ggJgCU+AhgCB/IH7gfeB8oHtgemB5oHjgd+BsYG0gbiBvIHCgceByYMQB8AEgdpQCUwF2IMQB0uAlYHIgcaBw4G9gbmBtYGwgYCBh4GKgY6BkIGUgZqBnoGigaSBqIGuQAdUda6BqYGlgaOBn4GbgZWBkYGPgYuBhoGBgUOBRYFIgxgF4BKBXIFggxAFsBWBcYF1gXoQBlwVeIF0gXCDEAVYEIFhgV2DGAUzDBIUEIFCgQCDEATwCIESgxgE0EmBJ4EogS6BM4E2gTqBPYE8gTuDEBNoE4EpgSaDGARAC4ETgxAEG4DhgQGAwIDFgMiAzYDQgNSA2oDegOOA5YDrgO6A8ID1gPqA/4D+gPuA9IDxgO+A6oDkgOKA34DbgNWDJBQgfIGAh4CJgIyAkoCWgJuAnoCigKeAqoCsgLCAtIC5gLyDEBV4EYCxgK2DEBVQA4MQFTuAn4CTgI2AiICGgICAQ4BGgEmAT4BQgFaAW4BfgGKAZYBogG6AcoB0gHkHgH+BuoB6gHWAc4BvgGmAZIBjgF6AWoBXgFGAToBIgEeAQoABgAeACoAOgBGAFIAbgB+AIoAmgCqALYAwgDeAO4A+gD+AOoA2gDGALIArgCeAI4AegBqAFYAQgA+AC4AGgACCeYJ9goCChoKKgo6Ck4KVgQaAgC6agp6CooKmgquCroMQGHgbgqOCn4KbgQaAgEaUgpKCj4KLgoeCgIJ8gniCs4EOgIAetoK6gr6Cw4E2gIAawoLHgsuCtiAZBAayg6H+gIAGsYIgGQgYgriCvILBgTaAgBrAgsWCyYK2IB4EErCCe4J+EBg8GoiCjIKRgpYQGKwumIKcgqCCpIKpgqyDEB94FYKhgp2CmhAYPCaWgpCCjYKJgoWCEBjoAoP9DACAHASACIAMgBGBCACAFBSAGIAdgRAAgAgggCYoAGwMKIAtgRgAgAgwgDcMADQ3gDuAAIA8gECARIAMgEooAGwYTIBRgFWAWhAAPBhcgAyAYYBmKABsAGoQARxYb4AAgHCAdIB4gAyAf4CDgIaAiICMgJIQADwMloCagQScgByhgKWAAICqggwB0ACuIABsALIYAhwkMIC0gAyAu4C/gQQAgChwgMCAxIDJgM2A0hAAPCDWgNqA3IDhgGYYAsQI5YDqGAA8DO6A8oIcARAgDIB5gPWA+ID+EAFUQAyBAYCcgFGBBYEJgACBDoESIAHMERaADIEaKABsCRyBIQiADBCBJ4EqgQQMgCkvgTOBNoE7gT6BQhACpAlFgUoYBSwlTYFRgOqBV4FbgRAAgEVcgWKBZoAMgDeAL4AAgWuBb4EUAIAlcoF2gXuBfoGCgQgMgAGGOADcWYiAUIGPgZOBloGbgACBnIGhgVGBpIGqKADkQVCBrYDtgbKBtoAMgbqADIG+MADcScCAnIHHgACByIHNgdCADIHXgdoQBVQA6iAAbEHcgAyB4YAAgeSB64HugAyB8igAbHn0gfiB/4AAggCAnIIHggqCDoAzgACCE4IXghqCHIIiEAA8SbKCJoIrgi2AeIIxgACCNoAMgjogAGwyPoJCgkeAAIJIgJyCThgF94CKUIGNglSCWIJegmOCZIJpgQ2CbIJzgnaAeoJ5gACCfoAMgoI4ANwRHIH4goYgBfeAjoqCj4KSgpWCmIKfgqKCp4KogAyCrYAAgrKADIK1griCv4LDgRgAgBLEgJyCyhgF94COzYLQgtWC24LfguCC5YLogu2C8oAMgveAAIL6gAyC/YCMgwGBHACAEwSAnIMKGAA8UIyDDYMSgxaDGoMfgyKDJ4MqgyyDMhADVCM0gAyDOYCMgJI4ANwYjIM8gAyDQhgAPFNHg0mDTINRg1SDWYNdg2GDZINog24QADwjcoN2g3uDfoOCOAvvgIOGg4qADIONgACDkIOUg5mDnoOjg6aDq4Osg7CDtoO7g74YDtwTwICcg8Y4C++Ai8iBMIPPg9KAeoPVgACD2oAMg92D4IPlg+iD74Pyg/WD+IP+IABsF6iAnIADhRgAg4CQBoQMgAmEAIAOhAyAEYQUhBuEH4QihCeEKoQthDOEN4Q6hD+EQhAQ1DREhfiAS4QAgEyEUYRVhQwAgA7ygHqCDAjjgJxahAyAX4RghGWFsYEOgACAaISMgG2EFIBwhHWE7IB4hH2EgIScgIeGFAgQAIooENYMCdgwjYQ4gJOEAICWhAyAmhgR7Gt+gJ6EooQMgKWEqIQMgK+EsoS3hR+AuIRQgf4wBmRAvoQMgMGExITJhGmA7oDOhNIoENRY1oTbhN6FToDjhbOA7IDlhO2A6IScgO44ENQE8oUIDIAlgYGxgPSE+YQphjAQ4DyA/ITvgOyBAIQMgQWFCYUOKBDUIbCBEIWxgGqAyhgVJA0XhRqGDASILR2FIYUkhSiFLIUwhgwBWA01hTiFCAyACT2FQigQ1F1GhAyAlYQAgGaAYoAMgUuEa4EOgU6FUoUEnIAAnhgFLBlXhVuFXoViEBUkIiuBZ4QAgWiE7iAD9BRmhAyAqYIMFyAZboVzhXWFehAR7Cl+hYKFJoWGhYuFjhAQ1B2QhZSEDIDHhgwX0BGYhHiBniAR7A2agGKCFBgYCaKFphAXZAxVgamGHA1AGIyBrYWwhEIQAkQJt4R+GBjMCiuBuigQ1hQXKAG+EBHsBcKGDAKgBceGHBNgCcuFzhAVJCh/gdOEAIDsgdSEegwXxjgQ1BB+hdqFsiAF9AneheIoENQR5oXrhe4YENQd8IQMgfeF+4VsAIAVUoH/hAeDoSgAgA4AhZmBXACD/QgAgCQEgAiAD4ASgBeBCACAGBiAHIAggCUEgCghgCWAIYAdgBmBCACDEAA4EoAJgAWBDACDgKwsgDCANoA5gD2AQIBFgEiATIBQgFeAWIBcgGCAZ4BmgGGAXYBZgFaAUYBNgxgBQ4CcgDiAN4AxgC2AAIBrgG6AcYB3gHqAf4CCgIaAi4CMgJGAlYCYgJ+AoQeApEKAooCegJmAlICQgI2AioCHgxgCM4CagHCAb4BqgKiAroCzgLWAuoC9gMOAx4DKgM6A04DVgNiA3YDggOWDIAN7gPiA0oDPgMuAxoDCgLyAu4C0gLKAr4CpgOiA7oDxgPaA+ID8gQCBB4EIgQyBEYEUgRuBHYEhgSSBJYEggRyBGoMQBFuAvYEJgQaBAYD9gPmA94DwgO+A6YEpgS+BMoE0gTqBPYFBgUSBSYFOgVKBVoFbgV+BYQeBZDKBYoFegVqBV4FTgU+DEAVDgKCBPIE7gTWBM4EugSiBaYFtgXGBd4F6gX6BgoGFgYuBjIGSgZeBm4GfgQwAg4DNnoGagZaBk4GNgYqBhIGDgX+Be4F2gXCBbIFogaGBpIGrgayBsYG3gbmBvoHAgcWByIHNgRwAgxgHWDGBv4G4gbaBsIGtgaqDDAcIXdGB14HagdyB44HlgeuB7oHwgfSB+4H/gRwAg4C1/oH6gfWB8YHvgeqB5IHigd2B24HWgdCCAYIHgguCDIITghSCG4IcgiOCJ4IrgSQAg4CuKoImgiKCHYIaghWCEoINggqCBoIAgiyCM4I3gjmCPIJCgkeCSIJOglOCVYEkAIOAplSCUoJPgkmCRoJDgj2COII2gjKCLYJYgl2CYoJngmmCboJzgneCe4J+gSwAgD5/gnqCdoJygm+CaIJmgmODDAsIToCChoKKgo+CkYKVgpiCnIKigqeBLACDgJ6mgqOCnYKZgpSCkIKOgouCh4KBgoKChIKIgo2Ck4KXgpqCnoKggqWBLACDgJakgqGCn4KbgpaCkoKMgomChYKDglqCX4JggmWCa4JsgnGCdYJ5g2ALsECCfYJ4gnSCcIJtgmqCZIJhgwwOCE4ugjGCNYI7gj6CQIJFgkqCTIJRgmAKUFiCTYJLgkSCQYI/gjqCNIIwgi+CA4IFgzAJ6A2CJYIqUApUDiiCJIMwCUBsggSCAoHTgdWB2IHegeGB54HpgeyB8oH2gfmB/kAHXGX8gfiB94Hzge2B6IHmgeCB34HZgdSB0oGjgxAH8D6Bs4G1gbuBvIHCgceByoHOQAhfGBJYI4G9gbqBtIGygxAHGHeBooFrgW+Bc4F1gXiBfIGAgYeBiYGOgZCBlYGZgZ4gAOeA4ZyBmIGUgZGBj4GIgYaBgYF9gXmBdIFygW6BaoErgS2BMIE2gTiBP4FDgUaBS4FMgVCBVIFZgV2BYQWBZDCBYIFcgViBVYFRgU2DEBRAOoE+gTmBN4ExgSyBKoDqgxAE8BCA+oD+gxAEyFqBDoETgRaBGYEfgSOBJoEngSKBHoEYgxAVWAODEARAE4D/gPuDEAQYIYDrgKqArICxgxAD4FOAwYDFgMiAzIDRgNeA2oDfgOKA54MgFngqgNCAzYDJgMSAwIMQAyuAjoCwgK2Aq4BpgGyAc4B1gHiAfYCAgISAiYCOgJOAl4CagJ2AoQWApECAoICcgJuAloCSgI+AiICFgxgXMBSAcoBtgGoMAPxCgDKANIA7gD+AQoBHgEqAToMQAagygF6AYoBlgGSAY4BfgxABYAuAT4MYGEAegDqANYAzgC4gBmwgBoAKgA2AEIAWGACkGBqAHoAigCUGgCgfgCeAI4AfgBoYAD8QGTgMgAuABkgJVA6qgq6BPACAFrKCt4AHg6IoAIAOuIK9gTwAgAq8growB1/8B/wBFAP8i/xwAB/zOuRzzOOdwz+Cf/z//AAL9OPdY52KfDv1Ms4UADgEO+YMAFgl2zeiX/z+fAADgiwAECU8AMAA8gFjBYoeDACqHAE4CGMEEpgA5AQAALf/gKAAAf38/P39/nx/vD/cHewMrAIwA7wD3ADcACQD+AH4AEQDDAOsA1wC3QQB3AgA3AIUAcAAAiAABAQYAowCIAQ8AQT+AQX8AGD8AfwBeAHIAcAA4AO4A5gB7AHgAuACRAMNBAMcCAM0ARwD/CwF8ATxBHGEMcAZ4AkF8AAQF4BWAVUMAVwkAXgAOgAeAGwCdQwDfhwABCOcYgzwBDADyAEQB/AUA/AAH+AGGAALDAMwTH4APoAcI4AXgA8ATwAWABoADgA2lAU8AP6oBQIgBUQfAH8AP8AcA/4UAzQeAH+AP8Ad4A0IAHwCAQR/ABB9AHwAfRQD/gwFMAQbAowGYCA3AP4A1gFUAVY4A7wd+/wAPAB8AP0YA/wYAH8ADcAB4QQA8AADEAegFBzAAHAAeQQAPBgAAAwAHAA+KAeQLDwAPgA/AD+APYA8gQQ8ABQ8QB/AHwIcCFQo/ABsA/wDDAIABAMMCAAd8AAL6AvgACIMCEQAAowILhwABEU8wAzwBBAGAAwABEAB8APjwDkH4DAj4CPgAABEAdwDJAA4BA/vDAI0SAOAP6Q/vD+oP7yeHewN1IQAAAUEB/Q4A/QEAH8Af4E8ABwgB7ABB7QEDAB+Av4sB5A8EAPbwB/AD8AHAMABwABQAxgJ+xwJ/A/gAmQBBZiQMZjx+JGYAZpmZQcMAvUMkZuAiAL3Dw4GBAH4IWgiZCdtJ24G9gcMAgQB+BIaExjy+BIYAfoFBgQAEfiZmIWlBJ28FD2+fnxcXowKUAeAvQWCvDuAvb6AAEQoCBIYY/QMAAMQCreAtA3g7iDu4e3iCABoY5ATrA5+cVwmuMxwnuA+wH6A/vwAAfgX8ivmU86jnVs2It8UAg4QBNAWBXgDoAIciAAwmALUASgBIAMQA2gDjhQABgwGPAKeKAAIAK0QA/xjvL2yj7u0C7wgH+BcC/f8AFIgUlAiIQABhowG6Cz//AHsAA3h6AIE4gsQABA3/AL88B3l+A3wH+A/zHYMD7OAhPnwGeH4yeDZ4Hn4Mfgd/AwAAZQAVAEUAcACiAAYAjAAAAIwABAv/fwCHvM6Z7IPxh/qjAMkBgACEAklBfgABAIGFAoWDADIHH/A/4H/A/4DKALkG/wH/gn+3f4cAsEEC/+BbAP8AfQAAAoYCxgDmAOAP7wfn8PAAAE1+Qn8QfwR/gH9w/4d4AgAAfwT/Bv8E/zh9AAGBvAAAAeFD40fnYOA6/gC+gAAHD4OHwcPg4XDwOHgcPA4eBw8DhwHDAOGlAeAE/v6DfPRB/4AA/6gEeAB9xASMAv8G/6MEyguBAAAHyOeHzwiHAAClBNoBwzxG/wAHDxAfID9Af4CIAbUECIOEwcKJBNaEAhICHwB/zAHwCgfAwODg+Pj8/H5+JQAjgQHDwyIAAMdBAP8BCPdDAP8JQL8A/wH+CfYH+EEP8AMf4H+AhgUwAQB/hgVWDwADAAEEBQwNfH14e2BnAJ8nAAE+PiP+AX5+KwDDABCOBYAAoUMYy0EYwwMAgX5+hAKMAPxBB/gBA/yDBYwBA/yJBTYMf4AH+J9gR7gD5BpQmUIQ2wIQAABBA4MFA8MBwQDJpAIQBAHw8ADkwwVpQcDBAQADhALMAPtBAP8BkG9BAP8AAYMCWhDy+Ph8fD4+Hx8PDwADAIMAk4YFUBI/AH8BwQDAEMBYgCDAHOAF+AL8hwWABzjHnwBvIK8AhwWABxjnJ8BbkFSALwD/6GUAIBMBIAIgA+AEoAWgBOAGoAdgCGAJYF0AIAQKoAugDIgA3QINYA7wMgDfBA+gEGARhgDfARKg8CEBLAwTIBQgFWAWIBdgGGAThADfBBmgGqAbhADfAhygHZwA3xweIB8gIOAh4CKgI6Ak4CVgJmAnYB5gACAooCmgKoQA3wIroCyWAN/gIA4gLSAuoC9gMCAxIDJgMiAz4DSgNSA24DcgOGAAIDmgOoYBKwA7lADf4CQZIDwgPWA+4D/gQOAT4EEgQmAToEOgRCBFYEbgR6BIYAAgSaBKhADfAkugTJAA3wlNIE4gTyBQ4FHgQgAgBFJgUyBUhAKNDFWgVqBXoFjgWWBaoFuEAN8CXKBdiADfAF6GArUIXyBgoGHgYqBjhAElGA4gZCBl4GbgZ2BoYAAgaaBqYGtgbGBtIG6GAN8Ab4gA3wBwhAElCnEgcmBzIHSgdaB2hAKNCnegeKB5YHpgeyB8hADfCH3gfiB/4G0ggIYCtQCBhgK1A4Jgg6BBACAIhCCFoIZgh+CIQyAACSCJIIrgi6CM4I2GAo0GjiCP4JAgboYCjQCBhAM9BJEgkmCThAElCJTglSCW4JegmIYCjQqZIJrgm6Cc4J2gnoYCjQafIKDgoeCihgNzAKOEAo0EpCCl4KaEAo0Ip2CoIKngqiCrhgDfAKyEAo0CrWCuhgKNCK8gsCCx4LLgs4QCjQK0ILWEAo0EtiC3YLiEAz0IueCoILpgu2C8hgDfCL1gACC+IL/gwIQCjQrBIMIgw+DEIMUgxoQCjQzHIMjgACDJIMqgy6DMhAKNCM1gzqDPYNBg0YYCtQHSoEQAIArTINQg1SDWoNcg2IYCjQzZIE3gACDa4Nsg3GDdhAKNCd6g36CoIOCg4eCHASwS4mDjIOQg5SDmIOdg6CDpYOog64YCjQ7sIO3gACDuIO+g8KDx4PKEAo0K86D0IPWg9uD3YPiGAN8G+aD6oPsg/EEgqAUg/eD+4P+GAo0PACEB4QLhACADIQThBSEG4UIAIA0HoQjhCSEKYQshDGENYUMAIAkOoQ+hEKEP4Q7hQwAgEBEhEqET4QAgFKEVIRZhF+EYiAUhDRlhGqEboRyhHaEeYR9hSgAgESAhIaEi4QAgIyEkIaggJeEm4UQAIBAnoSghKeEqISvhqCAsYS1hLowFUQ8vITAhMSEyoTPhACA0ITVhQaggATbhRgAgCTehOGE5ITqhO6FBqCAFPGE9IT5hQj8hFkAhQeFCoUPhROFoIEUhRmFHIdXgSOFJjgW3EfmgSqFLYUzhTSFOoaggTyFQ4UJRoRdSoVPhVOFV4Q7gViFXIVhhWSFa4VvhweBIACDgK1yhXaFeYV9hYCFh4WLhY2FkYWVhZqFnoWghaSFqYWshbCFtYaggbuFvoXAhSwAg4CVxoXLhcyF0YXUhdiF34Xih/GB5YXpheyF8IX0hqCB+4X/hgKGB4U0AIBGCoYOhhOGFoYZhh2GIYYkhiiFBqCALi+GMoY3hjiGP4ZDhUAAgCJGhkqGToZShlUKhlgqhleGU4ZPhkuGR4ehpACD/SQAgFQEgAiADIAQgBSAGIAcgCGAJYApgC2BQACAODCANIA4gD+AQ4BGgEuATQSAUDSAVYBYgFyAYoBngGmAbmgApCxwgHSAe4B/gIOAhYEEiIBgjoCSgJeAmoCfgKOApoCpgK+AsYC3gLmAvlAApDjAgMSAy4DMgNGA1IDYgN0EgOBkgN2A2YDlgOiA7oDzgPeA+YD8gQKBBIELgQ5AAKQ9EIEXgRqBH4EjgSeBK4EugQwAgGAGgSqBMoE2gTmBP4FCgUeBSYFOgVGBV4FaMACkJVyBYIFlgWuBb4EIAIOAkXCBd4F6gX6BgoGFgYmAAIGOgZKBloGZgZ+Bo4FJgaaBqYGsgbIoAKQVtIG4gb+BFACAMcCBxYHIgcyB0oHVgdoYAKQN3oHgghQFqBnmgeqB74HyIACkCfaB+jAGHDn/ggKCB4IKgg+CEoIWghogAKQ6HoIhgieCK4IsgjCCNII6GACkDjyCQ4EYAIBCRIJIgkyCUoJUglmCXYJggmYgAKQqaoJtgnKCdYJ5gnyKgAKGEACkAokcgABMgoyCkoKWgpmCnoKigqaCqIKvgrIgAKQytoK4gr2Cw4LEgsiCzhAApAbSgRwAgFLWgtiC34LggueC64LugvKC94L7gv4YAKRDAoMHgwqDD4MTgxeDGoMdgyJIAKRLJIMogy6DM4M1gziDPYNAg0aDSigKBDtNg1CDVYNbg12DYoNng2pQAKRLbYNzg3aDeIN/g4KDhoOIg46DkiAApDuXg5uDnYOhg6SDqoOtg7JIAKRTtIO5g72DwoPHg8qDzIPQg9eD24PeIAYcO+GD5YNXg6GD6IPug/OD9RyAAFiD+IP8gACEB4QAgAqEDoQThBaEGYQehQwAgEQghCeEKocNgC+H6IPsgDOENIUcAIAUOIQ9hEOFCACAJESESYRMhFOEV4UMAIBEWIRfhGCGwYBnhGuEbIRyhHeFHACAUHiEf4SBhISEi4QAgI+EkoSUhJuEnhgPVEyghKeEAICohK+EsYS3hLiEvITBhRwAgAjEhMoYD1QYzITRhNeE2igP/BCihACA3hAPzCDghOeE64TuhPJAD/wA9hgOlBj4hP6FA4UGOA/8QQiFDIUThRSFG4UchSCFJIUqQA/8CS6FMhAQ/BE0hTiFPjAP/E1AhUSFSIVPhRSFUIVXhViFXIVghSAAgDFmhWmFbYQAgXKFd4V6IBD8XXyFgIWEhYqFj4UUhLGFk4WUhZqFnYWjhSQAg4ClpoWpha2FsIW1hbiFvYXAhcWFyIXMhdGF1IXbhdyFFIXgheeF6oXshfOFLACDgJ32hfiF/4YChgaGC4YMhhKGFYYZhhyGIIYlhimGLIUUhjCGNIY7hHOBMACDgIY+hkKGRoZIhkyGU4ZWhliGXIZhhmWGaYZvhnGGdYZ5hn+FPACAAoCKhGaJhoyGkYaWhpqGn4aihqWGq4avhrGGt4a7hUgAgFa+hsKGx4bJhsyG04bWhtmG34bjhueHoxgAg/wAAQSABAyAAYAJBIAMEIAJgBOBBBSACBKAGQSAHASAGiAAHAQjgQQkgAwigCuBBCyABCqCHACgADIQAAQIMYA2EAAkCDWAOhAARAg6gD4QAGQAPiABHABCEACkCEKARhAAxARGghwBoAQyghABCAuANoIQASgLgDmCEAFICIA+ghABaiACHARBghABqAiARYIQAcgAghwCoAACEAIECAOAChACJAgLgBIQAkQIEIAaEAJkABogAxwAIhACpAgggCoQAsQEKIIcA6AUSIAygDOBBEiACDaANhAEFAQ5gxAESAyAPoA+MAQUBEGDEASoCIBFgzAEyAyAAoACEAQUCAqAChAEFAQRgxAFSAyAGoAaMAUUBCGDEAWoCIApgzAFyQSATAGBBEiADFOAUoEESIAIV4BWEAY0CFiAWhAGFAgrgCoQBjQMCIAJgiwGOAgjgCIQBjQIXIBeEAYUCGOAYhAGNAhngGYQBjQIaIBqEAYUCEeARhAGNAw0gDWCLAc4DEOAQoIMBgEEbIAMTYBTgQRwgAxSgFeBBHSACFaAWQSAeAiAWYIcAMIcACIYCEIgANwAXhAIBAhdgGIQCCQIYoBmEAhECGaAahAIZARpghwBwhwBIhgJQiAB3AReghAJCAuAYYIQCSgIgGWCEAlICIBqghAJaAOCHALCHAIiGApCIALcAE4QCgQIT4BSEAokCFCAVhAKRAhUgFoQCmQEW4IcA8IcAyIYC0IoA9wIXoBeEAQUBGGDEAcoCIBlgxQMSAxqgGuCLAS6DAQqGAw6MATUCE6AThAEFARRgxAGKAiAVYMUDUgMWoBbgiwFugwFKhgNOjAF1gwGaiwF+hwG6AgTgBIQBjQIf4B+EAY0iIIQBhQIhICGEAYUCIuAijAHVgwHCiQH2BBIgDuAOhAGNAiPgI4QBjQIkICSEAYUCJSAlhAGFBSbgJqASIIcCGIYCAIgAJ4cAEAEf4EEnIAIfoCBBICgDICBgIUEgKQQgIWAi4EEqIAAiiAJXhgJAiABnhwBQACOEBCECI6AkhAQpAiRgJYQEMQIlYCaEBDkBJqCHApiGAoCIAKeHAJABI2CEBGICICSghARqAuAloIQEcgLgJmCEBHqIAteGAsCIAOeHANAAH4QEoQIfICCEBKkCIOAhhASxAiHgIoQEuQAiigMXAhegF4wBJYcBEgEjYMUFIgIkoCSEAQUCJaAlhAEFAiZgJowDVQIToBOMAWWHAVIBH2DFBWICIKAghAEFAiGgIYQBBQMiYCIgjgOenAGdjwGqgwGCjgPenAHdjwHqhQHCjgQgmAIfjwIohwIAjgRgmAJfjwJohwJAjgSgmAKfjwKohwKAjgTgmALfjwLohwLAjAUgnAMdjwMqgwMCjgVenANdjwNqhwNCAwAgAGCLAaaHA5oCBiAGjAeFgwG6hgGejAG1AwwgDGCLAeaHA9oCDyAPjAfFgwPSiwHehQH6/0oAIAUBIAIgA2BEACADBCAFYFMAIAgGIAcgCCAJIAqKABsGCyAMYA1gDvAiACkQD6AQoAkgEeAS4BOgFCAVIBaEABsDF6AYoEEZIAIaYBvwIAApAxygHeBBACACHiAfIiAEIWAiYCOEABsIJKAloCYgJ2Ao8CIAKQIpICqEAFUUCSArYBkgDGAsYC1gACAuoC8gCSAwlADxAjEgBIgAGxAyoDOgCSA04DXgNqA34DigOYQAqQI6YDtCIAkDIDxgPZAAKQQ+ID9gQIgAGwNBoELgRQAgCUOgRKBF4EagR6BCCSAASI4AKQhJIAwgSuAx4EuKAZsCTCBNigGbDz0gTmBPYFCgUaAz4FLgHuBGACAMUyAZIFTgACBVIFZgMYQAGwBXhAGvAFiIABsLWSAJIFpgACBboFzgRwAgDF0gXiBf4AAgYCAZIGGIAZkIYqBj4GSgZSBmhAAbB1CgZ6Bo4GngSQAgDGqga6Bs4AAgbSAZIG6KAZkRbyBwIHGgcmBzIHRgLmB1oFDgTQAgBDEgXiB2jAGZDHegeGB5IHrge6A64HyMAZkAfUggAAUgfiAZIH+GAZkPgGCBIIJgg+CE4IUghuBLoEQAIAiHIIggiSAVIIqQACkEiyAZIIyGABsUFSCNYI6gj6CQYJHgkuAAIJMglCCVhAAbCJYgCSCXYBUgFo4AKQYVIJggCSCZhgAbEJrgm2CcIJ1gniCfYKBgoWCiiACdCKOgpKCl4Kagp44B9+AgqKCpoAkgqmAAIKsgrCCtYK6gr+CwoLHgsqCzoLSgteC2hgO3BLcgGSC4jgH34CK5IDUguuC7oDOgvGAAIL2gCSC+YL8gwGDBIMLgACAuIMMgxIgAGwTFIBkgxo4B9+AkwqAJIMdgACDIoAkgyWBPoMrgy+DMoM3gzqDPoNBgACDRoNLg04QA1QzUIF4g1eAAINYg12DYiAAb4C/ZoDOg2mAAINugCSDc4N0g3mBQYKegACDfIBkg4GAAIOGgBOBPIOIg42DkIBkg5eCFAgQA5ooBmRDnoAkg6GAAIOngACDqoAkg64YAGwLsoO2EAyUSUCDuIAkg7+DwoPHgMeDyIAwgX4wBmQTzoDPg9IYBmQRPoPWg9o4B9xJYoPeg+OBQ4E8g+WBPYPogGSD7jgH3APyKAZkE/SD+YP+PACkOoU/gTyABIQkgAmEDYQThTAAgAwWhBqGDASIJB2EIYQkhCiELIUIAIAMMIQ0hQgkgAg5hD5gFdwEQIYMBKgMRoRKhQhkgAwkgE2FCACADFKEVoUEJIAIW4ReYBXcGLiBFIBhhGYQF4wkaoRuhCaEcoR1hQwAgBB6hCSAfmgXzBAAgIKEhhAXZAw1gImGHA1ACFSAjiAYjAyTh4+BPACABJaGDAKgAJoYFdwOmoCfhWAAgAyihKeHokgAg/+AnAOABoAIgA2AE4AWgBiAHYAjgCaAKIAtgDOANoA4gD2AQ4BGgEiATYEEUIAsV4BagFyAYYBngGqCDAADgKxsgHGAdYAAgHqAC4B9gBCAgoAbgIWAIICKgCuAjYAwgJKAO4CVgECAmoBLgQRQgCydgFSAooBfgKWAZIIMAQAYqoBvgDiAPhAAXgwAwgwAsQRQgAhIgE4wABwIbIByDADOMAIeDAASDABwCJKAOhABXgwBwASdgxAAsgwBjjABHAiqgG4MAc4wAx4MARIMAXAIQ4BGEABMCGeAahAA7AgTgBYQAAwIA4AGIABOXAACDACACJWAQhABTAilgGYQAewIfYASEAEMCHWAAiABTlwBAgwBghwCAAgogC4QADwIGIAeMAIsDEOARoIYAgJAACwISIBOIAL8CIqAKhABPAiCgBowAywMlYBAghgDAkABLAiagEoQA/4cBCIMAEIYBEIgBB4sAAAYKIAtgDiAPiAAXQRQggwBghwFIgwBQhgFQiAFHiwBABiKgCuAkoA6IAFeHAJACBiAHiAAHhwIcQRQgjwCohwAsQRQghwGQgwBkAiCgBogAR4cCXAMUIBQgjwDohwBsAhQgFIwBzwIV4BaEAAOHADCHABACGyAcgwKDiAAfAg4gD4gAM4cDCIcAaIMARIcAcIcAUAIqoBuDAsOIAF8CJKAOiABzhwNIAg4gD4MDC5QCF4cADAIOIA+IAYsCGyAchAMLAgTgBYQCAwIkoA6DA0uUAleHAEwCJKAOiAHLAiqgG4QDSwIfYASEAkOHAaACAOABlACjhwAUAgzgDYgBEwIZ4BqIAouHAeACHWAAlADjhwBUAiNgDIgBUwIpYBmIAssCEiATiAEPiwGchwCIhwGMAg4gD4wABwIGIAeEARcCJqASiAFPiwHchwDIhwHMAiSgDowARwIgoAaIAtODACyLBBiHAQACBOAFhAAbhwCUAhXgFogDE4sAiAMnYBUgiwRYhwFAAh9gBIQAW4cA1AInYBWIA1OHAMgCFeAWhAAjAhcgGIgCHwIKIAuMAA8CGeAaiAETAgIgA4gBn4cAaAImoBKDA0uIAl8CIqAKjABPAilgGYgBUwIeoAKIAd/DAtqLBAgGDOANoATgBYwAGwME4AWgiwKQAgTgBYgAEwMGIAdgiwRIBiNgDCAfYASMAFsDH2AEIIsC0AIfYASIAFODAEwCAiADjAAXAwzgDaCHAKBBFCCLA4QCGeAajAALgwAQAh6gAowAVwMjYAwghwDgAxQgFCCLA8QCKWAZjABLgwBQgwIMjwAIiwAUAhXgFoQAG4sCAIsCJIMCTI8ASIsAVAInYBWEAFuLAkCLAmSPAIiHADgDFyAYYJMApIMAAIsBoI8AyIcAeAMooBfgkwDkAx1gACCLAeD/AABBIAEAYEEAIAICIAKEAAUFA+ADoAAgiQAAAgTgBIQAFQIFIAWEAAUCBuAGhAAVAwcgB2CDAABBCCACCWACQSAKBCALYAPgQQwgAQ2ghwBAAQTgQQ4gAg+gBUEgEAQgEWAG4EESIAIToAdBIBQaIBVgAaAIIBbgF+ACoAogGOAZ4ANgDCAaIBsghwCAEgRgDiAcIB0gBaAQIB7gH+AGYBIiIA8hIAegFCAi4CPgACAkoBfgQQAgAiWgGYQAxQUmYBsgACCJAMACJ2AdhADVAiigH4QAxQIpYCGEANUCKqAjhADFAivgK4QAFQIsICyMAAUCLeAthwA1jAAthwAqAy7gLqCDAQBBLyACMKAsQSAxASAyiABHAS3gQTMgADSIAHeGAHCIAGcBLuBBNSAQNqArYC8gNyA4ICygMSA54DqIAIcGLWAzIDsgPIgAt4YAsIgApwwuYDUgPSA+IAAgP2A4hADVAkCgOowAxQJBYDyMAPUCKWAhjADlAkJgPoQA1QNDIENgiwEGAkTgRIgBBZsAFoUAIgBDQSBFAiBGYIcBSAFE4EFHIABIiAFHlwBYhwBgB0OgRSBJ4ErghwGIBkRgRyBLIEyIAYeXAJiHAKAFACBNoErgiwHGAk5gTIgBxZsA1oMA4oYBHogBFZMA/oMAEoYABowALYUAAoYAeIgBV48BQIcAUIYASIgAb4cAQIYAuIgBl48BgIcAkIYAiIgAr4cAgIQA+IkB1ZIBv4MA0oYAxowA7YMAwokBNgAAQSBPiAINkwEWAkTgRIwEBYUAEocBeABPQSBQASBRiAJPjwFYhgJQiARHhwBQhwG4Bk+gUCBS4FOIAo+PAZiGApCIBIeGAJCKAfcCVKBTiALNkwHWAk5gTIwExYMA0osADgIG4AaHAQWUAwWDAgKLBAaFAQqHAFCGAHCHAUeQA0eHAkCGBEiIAkeHAJCGALCHAYeQA4eHAoCGBIiIAoeFANCGAO6HAcWUA8WDAsKGBMaMAsUDTyBPYIYD/gCgkwL+gwEKhgEejAYFhQIShgRIiAF3jwNAhwFIhgB4iAF3iARohQSJiAG3jwOAhwGIhgC4iAG3hgKQhQTHigH1kQPAgwHKhgD2jAH1gwLShgEmlAAlgwAShgP+AKCTBhaFAAqGAWiQAGeIBHiFAXkAoIYGWJABR4YBqJAAp4cAkIYBuAAghgaYkAGHhAHolADlgwDShgH2ACCTBtaFAMr/QQBgQgEgBQBgAmADYIkAAIMACIMACIUACgcEYAVgBmACYEsBIAAAxwATAWAAjgAvhQAgQQJgAARBYAeDAGUBYAKSAFOZAAaFAB4AAMQAcwQEYAhgB4oAKwIAYACOAA8AAoQAD4UAGo0AUoQAZMMAs4oAs8UAaokAwIQACoQAoQIAYACSAFECAmADhACxAgdgBcYAdQUDYANgAmCLAQAAAoMBG5QALwQAYANgBcYAtQAIxgAtAATFAXWIAUEAAJAADQEAYIkAvsUBhgAFxAFDAgRgBoQBQQAIhgCxAAaEAb0AAoMBvYQADY0AoAAChgAjAASEAE8EAmAFYAWGAUMEBmAFYAiGAPGEACgBYAaFAUeMAeMABocBNYoBCwICYACIAiUAA8MCF4gBrwQGYANgBcgBSQAGgwJFgwGLigBPAAOKAjEAB8oBTYcCToUBzAAGhgInAghgB44ATQACjACHAAOIAU0CA2ADwwF9ygJVAAWDAbuQAA0AAooAEwIDYAOOAruFAgQAB4UBgQFgCIoATQEAYIQCto4AxYsCusUCGAAIyAC1AghgBo4ATY0BksQBmIoA1cQBPIMCKccCDwFgB5ADZQEDYI8AnosCugIFYAOFAieJAXOMAqkBAGCLA7iLA0ACAGACiABtAgZgB4gDmwIFYAbKAtMCAmADjgDXAgBgAoYCFQAFjAKHAAbIAPkAB4gCaQACkABNiwMQBgNgAmABIADFAmHKAY0ACMUDW4UCEZIEd8YDZooDKQAGiAHnxAMkwwMjwwNdjASzAADIAZMFBGAHYAdgiwJ6AwBgASDJAnICCGAGxwF/igNlhwHqhAUywwH9hQRNAWACjgABAgZgB4oCYQAEigH7AgNgBMoD4QAEhAVTjwM4AAOFAYXIAY8CBmAFjAPVAAaDAhPFAnGFALOOBZkCBmADwwR5zAIdBAVgBWAFxwKrygXxAASMAi8AAsUDm5ACFwAFxgSTAATJA1mIA9MAB8wFg8YAKowB2YsFqgQDYAZgAswBDQIDYAfHBgEBYAaDAqmSBZUAAsMBT5IEbwAAiAWtAghgCIUGAYwCbQAAgwWriAOHhAU8AWADhASRiwAayAYsAWAIkAbDAgJgAJAATwACkAN3AACKAiMDA2ACYI8Dco8BVAIDYAKDBmWOA3kCAmAChQHvkABJAACSAE8AApIATccE1AACiAbzhAD8AGCHAP7/BwAgASACIAMgxQAGAAFBIAQHIAUgBiAHIAWMAA0JCCACIAkgAyAKIM0AMAIAIAGEACfFAEYCBCAAiAAhhAAYAyABIAWMACUCCyAMjAAxAgAgAYQAJQIIIAeFAEuNAE+SAGGNAHAAAIYAXwAHxQCFigCPhQA4AAeOACMCCyAKkABzhwDEQQwgAAyOAM8ACJAA3wADkAAzQgUgAAxCIAuOAQ8AAkQgCIYAKQAJzAAtAgAgAYgBRQIKIAqDAU+MAM0AB0EgAogBXQQCIAkgAooBdYcBfgABkgGHAA1CIAYBIAOKATEACYgBGwAIigA5AAHIAHODAHACAyAIhgHXBAwgDCAMjgDvAAmHAGGKAHkABMMCEYgCCwAChgITAACEAdsACIMBScwAcQAJyAF5hAC8hgJDAAqKAksEByANIA2GAE8ECCACIAzMAHMACYQAKQEKIMUCuAIAIAWKAkWHAHoCDSAAiQKZkgKhAAqGAmMACYoCwQALigLNhALWASAGygGrAAKKAqUCCiALiAIdhAFIigLJAgUgAI0Cl5ADIYkArAIMIAuGAr8CDCAIhQAVASANjgLVAgMgDIMCG5ADaQAKiAFNAgQgBYYAmwAFyAHbAgAgBYoDlwADhwAtASAJjgOthwGSAAaDA40BIA2DA82SA88AAoUAAwEgApID7QINIA2UBAmLA9TJAawACYUA6YkBiUkgAM4EYQAGwwElhwRhzgItAAuDAI8BIAmIBG2HAYwCBiAFjgRTAAfFAfmQAKNEACAACYUD4YsEz84BwQAIkgTtAATIARUABIoEbQAMwwSlygTdiAGsASACjgUJAA3IA8NBBCAABMwCrwAGhwVdhQFrkgTDAgsgDYYCQwALwwWDBSAEIAkgA4wFkQIGIAyMASkCAyAKiAFLAgsgCsYFzQAKhAX9AgEgDY4FSYQCHowA6QAKzgYjAg0gBIMAL4cAB44FywILIAuMAKcAC84F/QIJIA2IA98CAiAHhgYLAgAgCYgFCQQDIAcgCdQGP4QANIoD3QICIAiIBo0CACACQiAJ0AJzzQV8AAiFAjOKAbFDASAADcgErQIHIAbFBr+OBrMCCCAHjAShBAcgBiAFiAALAATFApmHBzuJBteMBzMABYgBmQAHiAQFAASIA88EBCANIAaFAN0BIAfJAymOB0UABYMB24gHSwABjAQ/iwdYAAeDAWGOB0MBDSD/BwBgASACoAMghwAABwQgBaAGoAfghQAAgwAABwigCeAKoAughwAaAQKghwAiQQMghQACAQughwAABwzgDaAOYA/ghQAiAgBgAYgADwIJ4AqGADMABIgABwALhgAjAQfghwAiAgigCYYAFwoQoBHgEuAToBSgFYQAU4MAAoUAEAAMiACHAQfghQACiQBgiQAwCxZgF2AYYBlgGmAbIIUAIAEAYIcAUIcAEAEP4IUAJAQJ4AzgDYwAmQ0GoBwgHeAe4B+gIOAhoI0AmAEIoIcAUAADhgARhQASiwDaDQ5gIiAjoCRgJSAdICGgjQDYAgQgBYgAR4QAUoYAUYsBGg8BICbgJ6AZoBigF6AooAEgiwEaAgzgDYYAM40ARosBWg8BIClgKmArICxgLSAuIAngiwFaAwMgBqCEABCKAIVBAGCLAZqEACSGAPmDABCLAZoCC6AOkADtgwAgiwHahQASgwBUAAqDATWMAksCB+ACkABHAAmDAPWIADONAO6LAF6EAFIC4AqgiwCIAgqgC4wAmYMAFokBeAIAYAiSAQWHABCHAXSLANoCD+AIhAAzCS8gMGAxYDIgBCCRAUaHAX6GAbSMAYuHAAAIM2Af4B6gNKAMkgGFAgugB4QAJYMAdAIEIAWMAcuHACIANcMBYQEgNocBtYwBy4MA/IMAFAEM4IQBNIwCJ4cCngc3oDigOeA64IUArI0CCgAPhgC/ADuFAK2MAkuFAFCHACKHAEwACI4CZwEDIIQAJogATwAHhgBXlQAIAAOMAXODAFQAC4gAZQELoIUAUosAmgELoI0AUI0EjAEH4IYCWogEYQM8oABgiwDaAgfgD4YA64QAEACgjQTMhQACAg/gPYgEGQI7oAiMARmNBIoBDmCNBQyFACQDPmA/IIUAdIUAXo0B6IsA2gAIjAHLhwAQhQBMAwigCeCFAuSLAZoAA4wBpwEEII0FjIcCsAILoDyDAK2EAHONAdgAC4wBywEM4IsB2gMCoAMghwIaADuDATWKALMABIcAD4wFi4gAXpABtwBAhACtAAaGA9OJAtYAD4wF5wEDIIUBBgEOYI8B+IQEQIgCNQAIhwAzjgKPBQugBaAEIIsEbosAYgELoIcAagIEIASMAT+EAFCIAtcBAyCFACQCD+A9iADt6H9BIP9DACAFAeACYAPgQQQgAQVghwAERQYgAwcgAaBBACDEABIGIAOgAiABoEUAIAUIoAngBCCFAA6NAERCBCADCaAK4IkALIMAZgEI4IcABIMAKAMKIAlgiwBMgwAwBgsgDCANYAuQAIuEAGQBIAqIAFODAGgFAWAH4ANgjQCOAQ4ggwDCAA+SAKMFAyAHoAEgiwCUhwCEAgkgCIgAkwEPoIMBDgAOjQBLxQERBGAB4AdggwA4iQDYhQDGAAKLAPkFoA2gDOALjABLAwFgAuCDAPjGAMYD4AUgBIYALwEFYIsAIAAFRiAEAyAJIAiDATeIABuHAYSLAYCLAGCNAZgCAyACgwF1igBZhwGEAwogCWCQAcQBIAiEAf+GAJyIAQ8DCCAJYI8B8AMBYAfgiAGEQqAGAKCDAVCDAMiHANyHAVCDAXBDBqCIAjgE4AJgD6CEAQ6IABONAZCHABKFAa6DADiLASyDAEgGC6ANoAKgAYgAQ40B0IQAEoQB64wAdIcBcYYBDY8AgAQJIAhgBY4BJYMAtIsBNIMBbIYBTIwAv4YCUAEgBY4BZUEGoIsBdIcCpIMAOIsBMIQCrIQCmZEADo8BCIcBeIYBcIwC5wAFkgBNjwFIxAImASANhAKvjwMkjALchgMRiwKIgwAogwFwAw8gCeCDAvCMA2SQA1mEA1KMAseEAMQC4AdgjwGEgwA4gwE4AA6EAR0BD+CDAziGABSQAa8DCqAJ4JEBxAAIxADHBgugDKAN4AuEA3eEAFSJAe2dAbcCIApgjgHYAaACgwCFAiAJYJsE8EEGoIcEVJABmAGgCIMDT5ACb4MA2AMOoAlgjwMwhQCYAg0gDIoAoY8AfIcDGAILoAyQA2+DARiFBEQBDmCGAEyQALsCAqABjAEvAQPgjgDOhQSdAOCSAOQEoAcgAaCOAWyQBiOEBNwC4AvglACkAqAK4IcAPIQCKAMgCWAEkgMdAASOALEDBSAEIIsELIgAAARgAuADYJEDXosFTIsA7AICoAFHIAAIIBDgCWAJIApgiQaAjQcOhwQkAwkgEKBJACCEAXABoAGIBr+PB0yHAzwBAqDUB0yFAH8CIAGghgAAjweLACCHA3wCAiABlAc3AxBgCeCGBniGBHMBCeCPBniFAXjJBwz/CbvA7zH7AL1G3yBC/wAJAAQxMAwMQAYAASMABwgA7wD7BP4CQ/8AB/+AGAAEAAIBJwAZgAB/Qb5p7xDwBv8B/gH7BveAgQAhIBkYCQojAAMODogIgwAIAn+A/4MACQUg7wD/ACCEADsAIMQAcwIAEACDAGMSQLdA/wDfEO8R9wD/CCAgQEBISCIgBTAAEQAYCEQA/wYA7xD/AP8BhgA5pQAaDgAAAd+gfwC/YN8B/wDvGKMAbB8gIMAAYAABIQAQABgICAQE/wH2Ce8S/QL/APoI9wj/AoMAHCMCBoQEBA0ACAKjAOsAAMMAiAK/QP/EAC8EEAAgACCFADmEALUFvwD/AH6BhAAKpAAJBUBAgICBgSMAAASkARQAf4MBC8MBB4YAKYQAtABApwE4AQgIowBKBfcA+wzdAYUBJgkAAGBgmJgADiEiJAAJBL+A3yBvoPsE/aUACQoQQABgAKCQAAwCBqMBGgUQELtM/gND/wAA+4QBLQUDAwAAEBCHATYPb5H/FOsA/wDPIO8g1yj/CIMAtQsUACAAOAAgGCAIQAhD/wAFf4DfEPQIhgCuDwACAMDAIDABDgEAf4H/IPeKAJ+DAHMBCAinARgLAADvGPsEn0D/IL9QhABiwwCfBxBAYCAAUBBAhAEZBb9A/0B9gIUBCgJ/gP+kAPMDAgIAAKcCFAPfAP8gowDmAH+nAUkFICAAQACAxwC2BwDfMG9Q9wD/pAD/owCMBBAQmBgIQwgADhAQAH2U9xjPMrqD5wj/EIMCiAATIhAFcXBT1BAcxQC8C79A6xT7CP4R/wH9AoUBLAU0BAgEEBOHAhilAaYC3yD/qAJpxQEZhwA3Ad8gyAHoAASDAuQBYGCnAhiDAToZICB/kO8A3yDX5LVK74B/MO8QABAwMCAg+PyjANgCkACwhAE/BvUOU8D9A9/EAUUJgAABAB4AKAQIB4UBFA9/Ab/A/0DfIO5A7RLvEqvMgwE1wwCTATMzIgICEvAAigHgBAD3GP8EiQA2AGCEATcJvwD/QH+AvcHXGEL/AABAJAADwcJgfCUAAb+AgwEgAb9AxQLoBO8QwAAIQkAAIiAjEIQAYAGU/YgAn4MAcAGUAMcB9wEAAP8QACABYAEgAGACYAPgBOAFIAZBoAcM4AbgBWAEoAggCeAKoIMADoUAFgMDoAIggwAIAQlgQQsgAQkggwAsAAFBYAwAII0ABIcAJoUAMoMAIIcAKAAAhgAFAQlghQA6AgAgAUHgDA6gAaAA4ALgA2AEYA0gBSCPACgKCqANYAQgAyACoACGAIcDCeAJoIYAqgKgAeCJAIYFBaAF4A0gjwBoAQoggwDOhQCohQCyAwsgCiCFAOoCAqAAigDFBQYgBmAF4IMAqJcBAIUA8okA5IMA7IkBBggHIAdgBmAF4ASXAT8AIIUBMokBDIMBLIkBRgIOYA6GAU+XAYADCmAKIIsBSoMBfIkBhgMPYA8giQGQAQhghwAMAg7gDoYAEwANjgGHgwEQAQ0ghwHgBw/gD6AOoAfghwBUiAAKhwHpkQHFBuAFYArgCqCPAeCFACqPAEoBBOCPAgaDAkIDCyAJII8ADIsAagME4AUgjwIYhwHmhQKCAQOgjwBMAQIgjQAAhQJYkQAIgwA4iwJahAAYgwCpjAC/AQhghAKYkABHAwrgCSCNApiFAFgACIUAqYgDH5EC1gEFIIUCgAEJoJEDWAQCYAPgCIQA64oDYJAAPwEEoIMANIMDfoMDmpEDIgMIIAMgiwC0jQCAAQhghQBaAQlghQN+kwNiAQgghgD0lgMVgwAIhQDgAQQglQOihQDiAgXgBJQDV4MABoMAyoUEYowD5JYBA44AsgLgAuCRAQqFAMKVAUSDAIwBCmCKA8CIAUmXARCNAYyFAMwACogEAQEEYJEBioYA7gLgCqCVAeABBmCHBTKDAQqPAkoACIgBLQMLIAqgkwIihwGqhQBgjwKKhwQaAQsgiQKEkwHshwW2nQAghQKilAIshAVzAQsgnQBghQAIgwJEkwIGAAqGBdUFCqAK4AmgmARoBOAJYAsgkQJGAQrgRAsglQO+AgFgAZIGnY8GtAMJIAlgiQbEAwNgBGCRBCSLBZaPBvSDAFqJBwQBBGCRBGIFBGAKYAsghwY+jQa4jQAsAQogkQSgiQUuhQKEiwa6AQkgjQDYkwTeiQVujQdAhQA4/1IAIAABQSACAmABYEQAIAADQeAEBaADoAAgBUHgBgKgBaBDACAAB0HgCAKgB6BFACAACUEgCgEgCYoALQEL4EEMIAULoAAgDeBBDiAADYgASQEP4EEQIAAPjQBZAKCEAGgD4AAgEUHgEgSgEaALYIQAegEgAEMgDogAL0MQIAIAIBNB4BQFoBOgACABQaACBuAB4AAgFeBBFiACFaADQWAEASADnAC/ARfgQRggABeMAFlBFiDEATLFANGdAP8AYIQBHgAg8DcBJAATQWAUASATngFjAQ1ggwCEAA2SAMlCACAAGUHgGgKgGaCXASoABUFgBgEgBZgByQEb4EEcIAEboNkBfAQAIAAgHUHgHgKgHaCRAdBBHCADHCAcIJ0CKgEf4CMgAB/wOQJPAGCEAoqDAI8AYIMAlAAP8C4CWQAdQWAeACDDAkgAB0FgCAEgB5YCWQEVYIMA8gAVVCAAjgJhABFBYBIBIBGKAEEAIUHgIgKgIaBGACAAI0HgJAKgI6DXA2qJAIIBJeBBJiAEJaAAICdBICgBYCeEAC0BKeBBKiAAKY4DnwArQeAsAqAroIsBwEMmIAIAIC1BIC4BIC2FA9MAYIQD2o4CXwEv4EEwIAEvoIgCAI0D/wCghAQOAOCEA5RBYCQAIMMDmAEbYIMCJMUCIgEvYIMEMAAvjAFjiQQCACdBoCgC4CfgRgAgABlBYBoAIMUB4gArQWAsASArlgR1QQAgmwBKCwAgACAAIAAgACAAIIcAOI8EwJsAigIAIDFB4DICoDGgiAB2mAT/gwHS0QVaATPgQTQgAjOgAEMgDAAg8C4FQABghAVwACCVBXaHAkiZBVQAMUFgMgEgMYwFtQElYIQDxAEgAIcCh5QF048AJokFeAAhQWAiAyAhIAAoIAAAiQLPmABdzgY+zQZXkgMPQQogAwogCiDwJwZwDgAgACAAIAAgACAAIAAgAJoGp4cAQpEGyocA3J0GpIgAgooCxwIAIACJARmUByOGALiMAb+JAwgCACAAjgFZiQCmhQAyhgD4kgH/CAAgACAAIAAgAIwBm4YA5gDgRwAg/0oAIAMB4AGgVAAgAgLgAoQAGQID4AOGABkBAWDFABYIBOAEoAAgBeAFhAAZAgbgBogAGQIH4AeIABkBCCDFAIQCCSAJRiAAAiAEYMMAXgIKIAqEAFECBmAGiACPAwsgCyCXAHwCDOAMhAAZBA3gDaAAigChQQAgAw7gDqCXALQBA2DFAQwBDyDFARQDECAQII8A4AERIMUBMAEHYMgAeAMgAmAChwDblAEPAgVgBYYAdc0BNIsBSAMNYA0gigFMkAGDhAE2iAEthQBMgwGIAhLgEogAGYcBwAIMYAyDAEuQAcOEAOwBYA6KAQkAAEEgE4YA0csCBIQBCoQA7wEAIIQCCkkgAIQA0wISYBKEAdHLAgYDFOAUoIsBLAISYBKMAXeDAETPAZqLAiACFSAV0AE3gwBkAg1gDYcAfwAgkwJ4hwJkAhRgFNgBN5MCsAIN4A2UABkCDmAOhgHJjQDixAFGhQJDjAEXAhbgFpIAGQISYBKFAOFLIACIARsDFyAXIIgASI4DRwIFYAWKAccCFOAUhQAZjQM/AWAWjgCHBBZgFiAAkgJ/AhRgFIgAdZEBugIJIAmKAEmFA7QCACAA0AKTAgdgB5ACw4YEEIwB8wIVIBWQAgMCBuAGkAAZgwJUhgEIjANHAhUgFcsCS4QAUQIYIBiDAI+MAM8CFSAVjACPAhcgF4YCz9AEjIMEt5ABiwIVIBWGA0kAANQE4wIAIACEAnOPAKgCDGAMhwUHhQPbACCVBRaDAHgBAmDZAEQFFGAUIAAghQBihgPImADriQR4kQQeAgVgBYMAj5ABJwILIAvUBQODABaTBOSDA0wAAMoB9QILIAuGAO2NBLYCGSAZjADrgwBelAVYAWAHhQHtACCVBjaHATACGiAajAOHAgHgAYcAYdAAt4sAUgIOYA6MBo8CFmAWigY/AgVgBYUGUYMAGZgFrwUAIAAgGiDEBxSQBjuGBpCHAM+QBTOFBqLEAKKSBxeDAPCEBpKUAreDAF7NBsgCAuACjABPAg5gDsUAo8cFS4kAkdQAowECYPgjAET/R/8ALwBH/wAfAAEAAwAHAA8AHwA/AH8A//8B/wP/B/8P/x//P/9///+PADDgIAD/Af4D/Af4D/Af4D/Af4AA/wD+APwA+ADwAOAAwACAAI4AMI8AcI8AQI8AUY8AYI8AcZAAQA4AAAAAAAAAAAAAAAAAAABH/wBHAP9H/wCOADAAfy//RwD/jgBAAH+PATBPAP8BAf6OAGIA/o0AcjAARv8AAf8BjwCBjgGxMP9HAP+OAWGOAXH4IAEwjwGgjwGxL/8vAJABYA4AAAAAAAAAAAAAAAAAAABH/wCOAX7QAWAiAIwAgAD/jgE/lALQigBBjwLwjgHSrwF/jgDDAf8AnAG0AADQADEA/osAU5MDbI8DAJQBf4oDJY8DMY8DQI4DUQAAjgNgjAG0kQO8lgDujwMlCgAAAAAAAAAAAAAAR/8AAQAAjgAyAACPAOKbAFIA/44Aj5EDMY8E0JAEoJwAsQD/jgTQgwT+nQDiAACPAMEN//7+/Pz4+PDw4ODAwICRAJ8NAQMDBwcPDx8fPz9/f/+PAF+UA3uKAFORAHAO/wD/AP8A/wD/AP8A/wD/L/+QAmAA/owFcgCA5CD/jwIhjAWRAH+RAX8QAAAAAAAAAAAAAAAAAAAAAf6fBaINAAAAAAAAAAAAAAAAAABH/wCOAeABAP6cBdEAAa8DwZADX4oFdJUDu40BP5QDH4oFkJEDPw4AAAAAAAAAAAAAAAAAAACLA2AC/wD/PgABAQCQBBCKA6GTBCyQBSCLBXGUBP2bBZKTB46LAzWUBS4MAP8A/wD/AP8A/wD/AJAFkJAAMI0Fckf/ADD/zge9jgZQkQKvDv///////////////////5AGwAD+nQiSlAcwCgD/AP8A/wD/AP8AkAdQKwCwAn0A/owDn48HDNUEkpsIcpQH7gsA/wD/AP8A/wD/AP+LAFABAH9YAP/wIAFwnwF/nAMxAQD/kASw/wAAQSABBiACoANgBGBPASAFBCAFIALgjQAChQAABAEgBqAH8CAACwQIIAbgAY4AQYQAQJIAAYMALI8AjAEC4EQBIAIEIAOEAJuDAIAAAZIAQYMAbI8AzEUBIAAHhQDZhQC/jgCBjwAskwCohQAwAQmghAEAjgDBjwBskwDowwCIgwB8jwFAAAGKAQ2DAAiTAIhBCiADC2AMYJUBfAABhAFPhwDYkwDIQQEgBQ2gDmAPYJUBvgMBIAKgjQGciAEORSAKhAG3BhDgESASYBOQAAuPAdyHAVABEyCJAkKDAfgGFKAV4BagF5IACwEAYI0AhAECoIMAMAEXIIsCggAYhgA/ARlgkQJEAQBgjwBwgwJwARrgiwLChwK+BBugFqAXmALLhwAEgwKwARvgiwMCABiFAH+SAsECEyAcjALHBB2gHmAaigCtBhMgH2ASYCCKAT8EGeAS4BOIAG8CE6AcjAOLBB0gHuAaigALBhOgH+AS4CCHAv8EIBYgF+CaAwwKIAPgBOAXoBVgG2CLA8ICGCAAiQOFmAPLAwYgB+CFA5QDEaAaYIsDhgUYIBQgFWCRA8gFASABIABgiwPggwPkBQJgASAXoIsEQgUYIBBgEaCRBAgBASCDBCSLBCCDBCQFCKAGYBOgiQSCAw0gDuCWAgCEBGOLBGCDA+gCBKAFRaAKA6AL4AyUBL+HBKiPBJiEANQCoAZghwS4AQ/glAF+iATnjQTYhQCSAgSgBYgE95MBfIYEqABgjwWIjADsAqAGYJUBeIkE5gECYI8FyooArgGgA4YF1wUJIAAgASCDBByTBSCTBSSLBawEBiAH4ACGA92TBWCLBWSTBeQEA+AE4ACKBgVPASACCKAGkAQbAACJBkXwIAaLjwXUhwYUgwaIUwEghgYYjAZPAgPgBPAoBweHBliLAJCDAAhTASCGAJiMAM8CBqAH8CgHh48A2P8AAEEgAQ1gAGABYABgAWAAYAFgAMwAEYMAAAoAIAEgACABIAAgAcwALYMABBEC4AAgAGACoAOgAqADoAKgA6CLAEYNAqAC4APgAuAD4ALgA+CLAGCIAEAA4IMAAg0DoARgBWAEYAVgBGAFYIsAiAsFIAQgBSAEIAUgBCCLAKCHAICHAEAMBWAGoAegBqAHoAagB8kA0wugBuAH4AbgB+AG4AfJAOkC4AUgkQB4DAegCGAJYAhgCWAIYAnIARUKCSAIIAkgCCAJIAjIASkBB+CVALYJCWAKoAugCqALoIcBTgkKoArgC+AK4AvghwFgAwrgCSCZAPQJC6AMYA1gDGANYIcBkAcNIAwgDSAMIIcBoAEL4J0BMggNYA2gDKANoAzFAdcHoA3gDOAN4AzFAeUC4A0g8CEBcMMBkAQKYAtgCsQCGQYKIAsgCiALxAIlAQzg8CUBrsMBTgEIoIMCVgUJoAngCOCDAmDDAfLwKQHswwEMAQZggwKYBQYgByAGIMMCNPAtAirDAMoABEGgBQLgBODDAnbwMQJowwCIAwJgAiDDArjwNQKmAwJgAKDDAvqaAuTwIwNbnANHAwNgAaDYAzpB4AIAoNgDHIQDw5sDXIMAooMAivA1A6SFAOCFAMrwMQPmhwEihwEO8C0DqIkBYIkBTvApA+qLAaKLAZLwJQOsjgHgjAHT8CED7gELIIsCIAMKIApgiwIUAQtgnQOwiQJghwJiiQJWAAjGAl+ZA/IBByCGAqDJBhMCIAZghwKYAAfIBimVA7SFAuADBOAF4IsGSIUC2gUEoAWgBKCJBmCRA/YJAyACIAMgAiADIIsGhgMCIAJggwMcBQNgAmADYIsGoIcDXAAAQaABDeAA4AHgAOAB4ADgAeAAzAbRgwbACgCgAaAAoAGgAKABzAbtgwbc8H8AAPB/BoD/DwBgAaACYAOgBOAFIAYgB6CPAAAGCOAJIApgC4cAD5AADw4MoA1gDuAPYBAgEaASYBOPAD8IoBTgFeAWYBcghwBAjwBADxfgFqAVIBQgGKAZYBqgG+CPAIADD6AOIMMAcocAgI8AgA8LYAqgCeAIIBzgHWAeIB8gjwDAygAugwDDkADPhwAgBx/gHuAdoBwghgAIiAEHhgEIiAD/jwEQhwBgARsgxACMiABHhwFIhwFIhwBgjwFQhwCgxABOAmAQ4IcAiIcBiIYBiIgAn48BkMgAFgVgBuAF4ASIAMeHAciGAciIAN+PAdCfABCOAAiPAB/wIABPjwBIjwBgnwCQjwCIjgCg8CAAz44AyI8A3/AwAQ+PASDwLwFQjwFg8C8BkI8BoPAvAdCOAeCQAA+PARAOB+AGYAVgBKAD4AIgAeAAjwQfkAJXjwFQDxPgEiAR4BBgDyAOoA0gDOCOBGCQAI+PAZALG6Aa4BkgGOAUYBVgwwCCjgSgkALXjwHQDh9gHmAdIBygCGAJoArgC48E3wAgjwAgjwEgBxxgHeAeoB+ghgQgiAUfBgvgCiAJYAiPAF+RA2/DBKUBIBuIBF+HBWAHF2AWIBWgFKCPAKCPAaABEKDEBGQAIIcEoIcFoAcMIA3gDmAP4I4A4JAB3wYEYAWgBqAHiATfhQXgyAQwkAEPjwAIhwQohgU4AKCOBCCQAW+PAEiIBHiGBXmOBGCQAY+PAIiHBKiGBbiQBJ+OAdCQAMeDBOjKBiqRBN+FASGQAP+GACCIBTeGBSCQBR+PAWCPAWCHBXiGBWAAYI8FYI8BoI8BoIYFuIgFr48FoI8B4JAD8IcF+YUF4QAgjwXg/wcAoAHgAuAD4IcAAIcAAIcAAJ8AAIUABAcEoAXgBqAE4PAvAAIBBKBBByAKCGAJoAogCmAJ4AhVIAeEAINBCyALDCANoA7gDqAN4AxgVQsggwDEQQ8gBRCgEeASoMQBCADgVQ8ggwEEBhMgE2AUIBVBoBYE4BXgF6BVDyACF+AYhgCHBBkgGuAa8CoBTwMbYBMgxQG4hQDIBBxgGuAaU6AdAaAZiACFARkghwEIkwGIBh7gH2AgICGQAU8AHIgAxQEcYIcBSAIi4CKQAU8GI2AkoCXgJpABT4sBBIMBiAAnRGAoASAnRCAPByApICpgKyAskAFPARfgiQFGES0gLWAu4C+gMKAxIDLgM6AuoIkABgc0YDXgNqA3IJEAAAE44IMCwBU5YDkgOuA6oC5gO2A8IDtgOyA8IC4giQACBz1gPiA/IEAgkQAEAEGEAv8DQqBC4EFDoAAnQeAoAKCDA0YDKKAnoPAjAAYBROBDQ6CFAAADRSBG4IYDgvAuAE0KR2BIYEdgSGBHYEjJA8kBYEnwKAADAkqgS4MD/4MD/4gD/wRMoE3gTvAmAE0CTyBQgwQ/hwQ/AuBPIIMEFANN4FGg8CUDwpMEBIMEVvAnBABHUqAGU2BU4FGgUJAEPwFQ4JUEUglV4FZgV+BWIFWgQljgBlmgWmBKoEvwKAR/CVtgXKBdIFzgWyBDWKAAWUmgUgCglwTQBligXqBf4F5E4FgA4EpYoJcFEAhgoGGgYqBh4GBP4FgA4JUFUgZj4FjgZGBjUuBYCqBYoGVgWOBlIFjghwUABGbgZ6BogwY/AKBWWOCHBUAEaaBq4FiDBn9X4FiFBYFb4FiIBb/of2sg/0QAIAUBYAJgA2BDBCADAyACIMcACgcB4AVgBSABoEEAIAAGiAAPAAZIIACWAC8HB6AI4AigB+CJAAaEABhIIACSAG+DACQBCeBBBCABCaCIACgBYAZMIAACIAZgjwBYQwQgiABoAWABSyAAgwAjAGCPAJiDABiDAAyHAKhNACABB6CRANYBBiCDAGYBBmCHAOhLACCfARCfASiVAVCJACybAWiXARAAAYYABZ8BpJkBzAIAIACeAeGHACSVAhCIAmKEAKUACIQCqY0ApoUBUAEH4JkCUAwB4ALgA+AEIAkgAuADjADjAwqgAaCHAiCDACgCByAIhAAPAQagmwKeQwQgBAmgBCALiwFRAODDARQJCWAEIAOgAqABoJkC4goEIAQgBCAEIAQgC4sAWQBg8CECFBAEIAQgBCAEIAQgBCAEIAogAYkCiQGgAfAkAlOKAzSFAF+GA4mDBACQAxCaA50DCCAHYMcBGAAFhgMDjQNQmwPaAwkgBaCEAHqEA//HAGSDBAzwIwMQgwQ8jQQaBAXgAaAAhARL8CEDUIMEepAAepYEh/AhBKYHACAAIAAgACCXBMjwIwToBgAgACAAIACWBIcBCGCfBSwHACAAIAAgACCXBUzwIwVsCQAgACAAIAbgBqCRBIrwIwWsAQAghQLmgwRYjQTMAQQg8CcF7IMAMo8DFIMDEIsEuAEB4JMBMgEB4IkC8AEEII8GVIoEfIMGEZIBMwAGkANvAAaYBreFBFiLAtyTA2yGBFiLAp2MBo2XAAAHBCAEIAQgBCCEAHYAIIkHPJkGyoMALAAGkAOvgwA6AQAgnQAA/x8AIAEgAiAD4ATgBeAGYAcgCKAJoAogC2AMYA1gDiAHIJ8AABwP4BAgEWASYBOgFKAVIBZgByAXYBigGeAaYBtgB58APeAhIAcgHGAdoB6gH2Ag4CHgIiAjYAcgJCAl4CbgJ6AoYClgKp8Af0EgBxwgKyAsYC2gLuAv4DDgMSAy4DPgNGA1oDbgN+A44J8AwB85IAcgOqA7IDwgPeA+4D8gQCBBIEKgQ+BEoEVgRmBHIJ8BAB9IIElgSiBLIExgTSBOIE+gUCBRIFKgU6BUoFXgViBXoJ8BQB9YoFmgWmBboFzgXeBeYF/gYGBhYGJgY6BkoGUgZiBnYJ8BgB5oYAcgaeBq4GtgbGBt4G7gb6Bw4HGgcmAHIHOgdGB1nwG/AWB2hABbGXdgeOB54Hpge+B8oH3gfiB/oIBgByCBoIIgnwIAAIOEAFsZhCCF4IaghyAHIIggiSCKYIsgjGCNYAcgjqCfAkAej6CQIJEgkiCTIJQglSAHIJaglyCYIJmgmiCb4AcgnJ8CfwWgneCeoJ8ioBChoKIgo+CkIKXgpqCnoKggqYQAWwGqIJ8CwBir4KwgraCuIK+gsKAHILGgsuCzYLQgtSC2hADfALefAv8XILjguSC6ILvgvOC9YAcgvqC/YMCgwWDChADfA8MgxKCfA0AfByDF4MYgx2DIIMmgymAHIMugzCDNoM5gzyDQINFg0uCfA4Ae02DU4NWg1qDXoNjg2eDaYNtg3CDdYN7g3+DgIOHg4p8DvwDg8/8AAP8CACAAVCABQyAARCACjwABSSADzgBNjAAuhQBJUSADkgBlAgIgAosAS0ogBAIgAyDGAMqUAKmRAMJFBSAABcUBD5oA48gA6gEgBEsgBYUBH5YA5ZUBQkEGIAIGIAaUARWSAXLUAakGBiAGIAYgBpABF4wAZoMBRdQB6wQHIAcgB40BlZQBqQAD0gHtBgggCSAIIAeKAhcGCiAL4AwgBYMB640CMZQCAQMIIA3ggwJYBA4gD+AQhAIXCBHgEiAT4AUgBY8Bq5ICQcMCWsMClgIUIAjEAtsJFCAHIBUgFuAXYMQBjgEgBJYCs4kCEhIIIBggCCAZIBrgGyAc4B0gFCAewwKfAuAGIIgCrJwC9wIHIBRCIBlCIB/EA1kGFCAHIAYgBYUCa/AmAzUAHyYgAB/FA1kDIAYgBoMC7fAmA3OFA5wCISAhiQOhnAOthgMIiwPRyQOj8DAD58QDZsMDY4MEI40DpYsDMwEgBJwEPwQZIBkgGYMDY5YD6QAAwwEn1gIvRhQghAOqhQMvmgSzkQIMhAJahAOpAgYgBZME7fggAfEIBiAGIAYgBiAFlAJrxAI0ASAEgwGH8CABxwAEkATvAADDAfX4IAFrBAUgBSAFlgGpAgEgAYcAxZYBCQAFlAFjhAAwBSACIAAgAfAoAL+TAKoEACAAIAGcBkGEAOaZAGX4IgBzAAGZBqf4LAAzAgAgAI4Ab/gpBzwSACAAIAAgACAAIAAgACAAIAIgAocHOVcgAEsgAlAgAEggAgAg/x8AIAGgAiADIATgBSAGIAXgBaAGYAVgBKADYAJgAaAAIJ8AAAgHIAigCeACIArGAA0BBGCDABAJCmACYAmgCKAHYJ8AQAUL4AygDSCDAEQLDuAEIA/gD6AEYA6ggwBYBQ1gDKALoJ8AgEEQoAER4IUAhAYS4BMgE2AShgCVABFBoBCfAL9BoBQCoBUghwDEAhbgFogA0wQVYBSgFJ8A/wagBSAXoBjgiQEEiQESBRigF6AFYJ8BQA0ZIBogGyAcIAsgDaAdoEEeIA0d4A3gC2AcYBtgGmAZIJ8BgIUAEgcPYBOgH2AgoEEhIAYgoB8gE+APhQAHnwG/ACDwLwAQjwAA8C8AUI8AQPAvAJCPAICOANDwMAC/jgEQ8DAA/48BUPAwAUDJAU0BIBeEAA0BFyDKAVoAoJ8DgMoBDgDgQxQgigO2AGCfA8DKAM5DIBAAIMoA2gCgnwQAygCOAeAMQSALAmAMIMoAmgBgnwRAxgBOAOCDA4AHCCAH4AegCCCDA5wACoYAEZ8EgMgADgTgAuABIEEAoAUBIAKgA6CFAFABBWCfBMDKAd4C4CAgQSGgASAgyAHKAaAGnwT/iQF/AqANIMQBkgYgHWANYAvghwGYnwVA8C8DkI8DgPAvA9COA8DwMAQPjgQA8DAET48EQPAvBJCPBIDwLwTQjgTA8DAFD48FAI8FUPAyBUCMAZPwLgGA8DABz48BwP9BACABAWCEAABFIAACIAFgzAASigAHgwAKCQLgA+AEoAOgAqDwNQAACQXgBiAAIAZgBaCDADYAB44ABYMANoMAPIYAHI4AjwABigAVAAGDAHXPACmEAHUCBmAFjACbhwDUAgbgBYwAs4sAGIUANgEEoI0ABIUBCocABAIDIAKUAPOFAIABBiCRAACEAL6LAVOUAPMCBeAGgwAPkAFPhQCAAACcAWeFAIAAAJQBiwEF4IMBTp0BpgIF4AaSAAuJAQoDA6ACoJsBaAIBYACUAhuHAMADBmAFoJMCFIYCPIMB/5QCW4MAGIcA+JMCVIwCfAJgBqCJAqCRATqFAiIAAY4AF4oCPgRgA2AH4JUCzogAdpoC7QUAIAAgAWCVAs6IAPYAIPA/Ay7wPwMu8LUDLoMCyMQAxJoDbYQAgJYDTYMDCAAEgwEvmgNtAwXgBiCHAsycApQDYAagAMUAewAgkwK8AgbgBZwFE4UE5AAEgwEvkAL7hgV0kwUnACCfAiiUAgiJBYmdAecEYAagACCWAcoCYAagnwHkhQMIlQHKhQMIAADwIQFnBWAGoAAgAJUBTwFgBpgCJ4MCyIkE4EEEIAAEkAFTgwMIiAEoAqACoIoAtIYGQ40AHAUFYAagBuDNBxSHBxQCBmAFiwbzjgFxiQTeAQMgyAdUjAdPAwAgASCYBzTwKQBNAmAGoMQB5PA2B3+JBOT/6CoAIAEB4EICIAEBoFoAIAEDYEIAIAAE8DQAWwMB4ARgRAAgAASEAF0BAeDwIwBchQBWAQRgRgAgAASGARHfAJYDAeAEYE0AIAAEnABdjwFMAQXgQgagAQWgiQDYmwFsAAOOAY0AB4YAlwEHIIkBoJsBKgEDYIsBlAAHhgEViwHcnQHsAwFgBOBBACAACIoA1wUJoAogCeBCACAACPAgAJkBA2CLAdaDAlwFCyAAIAtghQJgAwcgBaCdAeoBA2CJAlCDAl4AC4gA2QMMYAAghQKomwGqhAKMAmAH4IcCmgcAIA2gDqAN4IkCoAAInAHphQJKgwJSAAyGAxkFDyAAIBBgiQLghgJqAKDXAFaHAszDAmIEC6AQIACGA18EC+AKoAmDA2ucA3EAAIwCywwMIA0gDiAPoBBgC+AJhQLnAqAFIJ0BKo0DzoQDGgMgDWAMhwPnASAA8CID74UDEIMDlAELoIkC4PAhA2wFACAAIANgiwJOAQkgQgqgAAmFBGXwIAQtDQAgAWACoATgBWAGIAfgjAIaA6AGIAWEBG34IQBWhQCWiwTUBAAgCCAAhASr+CMAlocCSoMFFkMGIAAF8CoFJwAAhATNAQTgSQAg+CkAloMEzocFlgAEQ6ACAKD4LwBWAQNggwVqAANbIAACIAFggwXqAAHozCAAACD/AABBIAECYABgQwIgAANBIAQDYANgBUEgBgJgBWCHAACXAAAAB0EgCAEgB4gABwAJQSAKAyAJYAtBIAwBIAuHAD+YAD8BB6CEAEIA4IgASACghABSAuALoIQAWgDghwCAlwCAAABBoAEB4ACIAIcAA0GgBAPgA+AFQaAGAeAFhwC/mAC/nwAQhgAQiAAHjwAYnwBQhgBQiAAHjwBYnwCQhgCQiACHjwCYnwDQhgDQiACHhgDYkAC/8CcBGIYAGJAAJ/AnAViGAFiQAD/wJwGYhgCYkACn8CcB2JAA2I0BGZABF4YAGIcBH5gAL8YBZpABV8YBTocBX5gAb4YAkJABl4YAmIcBn5gAr4YA0JAB14YA2IcB35EAx4UAGfAgAheGABgAYIYEAI8BZ/AgAleDAFjDBGqQBECFAJnwIAKXhgCYAOCGBICPAefwIALXhgDYAOCPBMAHAiACIAIgAiCGABCQAR+XARCGAACQAEeGAWCIAj+GAVCYAz+OAIiQAZ+XAZCGAICRAO+FAeGIAr+GAdCZA7+NABEAYI4DAPAoBSeGAXCPAz/wKAVnhgCYAOCOA4DwKAWnhgDY8CADv5cB+I4CAJgDH44CKJACd8YBVpgDX5ACaIUAgY8Fl5gDn44CqJEB94UC6ZgD348C6P9GACABASBBAqACA6ADR6AEAKDGABYCoAFgTAAgAQEgiAASR6AFAKDGAFaaAC0CASACiQBRR6AGAKDGAJaYAG0EASAH4AOJAJFHoAgAoMoA1gGgB5AALwcBIAlgCmALIIkA0kcMIMgBFgigC2AKIAkgAWCPAPwFDWAOYA8ggwEUSwwgQQigBQ9gDiANII0BNIcBRgQQYBFgEkIgDEcgEwAgyAGWAiAQIIYBcpABPYMBjAAMnAGRAQwggwGwiQFyAgAgAPAkAcMCEyATkwHnlgG/QxMgQRQgygJelAHpiwHEkwJQBhQgFCAUIBSHAmOQAevwPwKAjgKAlgKRAhQgFPA/AunwfwLplgKp8H8CgAEBoPA8AkIA4PA/AgADACABoPA4AcQA4JIBfgCgnAGSAOCRAbCLBQADD6AIINgBbEEgCAIgD+CPBTSJBP4CC6AFQSAG1AWvyAXWAiAL4I8FtoUE/gYHYAMgBCAFxQXxRyAIACDKBhYEIAcgAeBIACACAaACwwYzhQYNRyAGACDKBlYCIAHgSgAghAZKhQZNRyAFACDEBpacBm8GACAAIAGgAsUGsUcgBIUGq4QGr08AIIQGzkcgA4YG61MAIAEBoEcCIAEB4FUAIAEBIEcCoAEBYFMAIIQADkegA5gAK/8Zx68KmLF0Q9m2kg9maib/Zp9/fvn88/jH8Y9C4R8ZDla4G+OqIW1P1d5SUtreUs8+fvl55/vn889C987gQRtZplbhtXReaEI0obov2pV9np/nx/nnePN8+T7zPPkeQ2WX2/CZabJVZqrMqzO/Pfl+4/zh/sP8h/gP8D/D/j+lNkFVZgoBZqrM/phVmaszx0L4hxr4D/Af4B/hP8NKW4W2tZbIzipsF9nVWaqz73NB3+cDn++/z0F+nxX8Pzqpe0k9VFRVjqpFVUdS6iCfeN84Qc88H+ee88/xz3nnU/qZLcyWmtNMaWlNQ2VabJ/jz/Hn+OP8QfF+4D/5fvB/dTNreR+3HGWlk9BJqWTxlv/wH/iPf+Mf8I/4x/zjfvEltkNljtRT+8VWr6nWW5Na+D/5fuf4n+Of5z7PQXyfE1YF4krTeum9aVW8KtqVjyqe54/zhADwAHmDAFzgMzzPC5KV2T1ZpjTjmnNl1p5ObB/jH+Gf4cf44/z5fvgff48loWa3D2mqzNCZldnQmdWZx/mjARwB/w9D/h8PZS0dZWUtPWWlbclaczXV1UQf/B0++fzz888jqeIoJa/qICGrZarDVYa2eOd553zjeeeDAdAD88/vnkSrMgVVmWpM2/pEP8MFH+GP8OP8/w8AYAFgAqAD4ARgBSAGIAfgjwAAnwAADwigAGAD4AngCuAEYAfgC2CPAECfAEAFBiAM4A2ggwACAg4gD4QACQMQIBFgjwCGkwCGBhLgE2AFIAyEAEURDaAOIBTgFaAPYBAgFuAXoBFgjwDIjwDIABKEAE0BE2CHAAAOGKAZYBogG+AcoB1gHiAfjwEHjwEHkgA3AhigG4QATQIcoB+PAUWPAUXwJAB1hQC6hQGA8CMApgIW4BeEAM0CFOAVigD1nwHAiQEAAh1gHoQBDYMBCgAgkACLASAgigIKngE1JSCJAc4ADiYg8CUBbAMM4BigJyACGWAaKCACG+AT8CIArQAMgwFFAuAYoC8gABuFAPnwIADvAACEAiGJAmSJAlKEAArwIgEvAQBghQHIiQJqACCGAckAB/AoAm0CHWAeigIVhAIogwKp8CIBrY0C0AIPYBCMAmUAE/AgAe+GAxAwIIYDKPAiAi8BAGCJBBYCFOAViAKV8CcDagAQigMXhAIyAeAYgwMhASAg8CoAq48CagIYoCDwLgDphwAIhgUA8DIBJ4UASoQFQI8BZfBUAHWNAcqPAcjwLQHoAB+PBgcC4BigigIq8FQBNYsBmokBlp8GgIcAwI8B2IcB2J8GwPB0AADwigZ1/y//RwD/L/9BAP8LAf4D/Af4D/Af4D/AL/8DD/B/gEX/AAsDAwcHDw8fHz8/f38i/0j/ACoAAwEBDw9HAP8v/wsAAwAHAA8AHwA/AH/UADIrAA0BAA//A/8H/w//H/8//4QAawr8A/gH8A/gH8A/gIMAu40AbgIB/w9F/wAB/gHRAFEBP8BBf4CFAFL4IwAziQCEIwEBAwNHAP8wAN8BXokA1UEBALAAPy8AigEEQQH/AAOJARRB/gEB/ANP/wCPAGAK/P/4//D/4P/A/4DQAZUCAQEPjAEfAv7/8IwA4JMA7A8A/wD/AP8A/wD/AP8B/w//jwEQjwFgiQJUQf7/APz4IAHgjwHhjgHwkAFvR/8AigDglAIrkAEAjgJRkAHgjQKxkQBuDv///////////////////4oCIJQA648CQPAgApCPAvEOAAAAAAAAAAAAAAAAAAAAR/8AjwJgigCwlAJ7jwDQiwJglAIsCf8A/wD/AP8A/wCPA0wD//7/8JEB4I0BsfAgAW8v/4QBCYgA4NABMAP/D/9/Kv+YA1+HArdH/wAw/4sEIAL///9N/wCPAQwD/wD/ADD/AD+jArcB/3/kKP+NAeEAA1f/AAD/igDglABrjgEAkQCPjAHhAP/wIAL/RwD//w8O+XkAEAhTUJn4xDz4Bk4BQv/4Ga/8B/wD/gH+AP8jw+ID1RacHz0+Q3wPcIrwQQP8AhfoH6UAGBSA/wAcA0zDJuE5+LBwuXnGPusXAP/DADkF+AfwD/kGowA8DzoGkSwM/B34xsEmAeIRb7HDAByjAFIBP/hC//APE2hgf3E/xwfIAI4R7BvfH8UAPQH4P0P/HxlVw46BJuET8Bz82DhcPOMfwD+Af+Af8A/8A6MANhP/AFFPiYeOgVfQcvB5+IR84R1Av0GAfwPQL/APgwC6Gf0CjzCRHswPZYWECE+AuM+f78A/4D/wH/ofQ/8PFR0DExAjoKPw/Xy6XrdP1w8A/xDvoF+DALaDAFwV/wBXmEKMepzLrIUGkQJYga7Q4P/w/4MBMAP4H/wHgwBcD0X4+ADeA0YHhebwx+iOqc5B/wAF/AP4D/j/hQB5DwkePjjPXIwPiw93h/uDOUCDADYBX6BBD/DDALsRgH+fD0g8Pg75HZj46Pj38O/ggwFSA/4B/QJB+AejAXgUDohSnNAc4Y4LzI0OvAfxAfD/4P/gQv/wFh/4B/4BLMBIgcID5da9zqHGq8yHxP8AwwEaAPjEAV2DAdgVJiFHQEfg+/h0vG6erx4+HiDfQL/gH6cANgH+Af9HMw9H/wAwAEb/ABb/AQEHBx4fOD8xPmd4ZnjM8AH+B/gf4EE/wEF/gMUAMQ8PAH8A8A+Afw//f/8P8H+A0wA7BwEAAwAGAQwDhAA8BP4H+A/wQR/gAT/AIwAFBwB/APgHngBqIgEDAwMPD4gAOAj+Af4D/A/wDANCGQcBGwdCMw+FAFiJAHKHAOABMw+VAOoBAACDAMwDHB8YH0EzPAVmeAD/A/yHAJiDAFjHAIICAP8AJP9H/wAjAAgfAP8A4B8A/z8i/wE/wNMAPQsBAAcADgEYBzEPAP+FAFCFAFjPADEBAwNGAP8FA/wzD2cfQWYeQ8w8Qf8AQf4BQvwDAfwDMAAA/0IB/kMD/AMMEExwRczwR/8AKwACBwB/yACAgwBwzwAzAA+OAi3fADODAFBCGQdBDAMEJgEjADFHAP+IAMcH/v/w/wH+H+CGANiHAg+OAp8BD/CQArCGAImHAOCLATRBf4BHMzxHP8AAG4gBBwVmHuYejHxE/wCFAdSFAEhEzPABP8CDAPSTALaFAEKLAnSDAFRDMw8GAw8BAeAA/kcA/5AAvwMH+AH+kwDUAQsHhQOKjwDwhwDopABgigONpwBwARMcRjM8A/8Av0BFP8D/QwAgAAFOIACOAAcAAkcgAAEgA94ANQIDIACWAEmFAAgABN4AVQAEhgAxAgQgA4QABwIDIASMAI8AAskAt9QAqwACgwAFjwC71gCtAACOAOcCASABzgDHhgAGiQCp0gCDAAOQAPvIAQLcAGsAA5IBZY8BPAICIASJAEsBIAGNAY2RATv4JACHjAHSnABVAgMgAM0AlZ4B1ZABXJwASQABlgCPzQGsAgEgA48AjwEgAPAsAcUABI8A+/AmAcsAA4cAL4sBO/A0ATcMACAAIAAgACAAIAAgAPAgAoGIAZrXAH+HA5PwJgLLAAOFAlvJAWvwIAGLAgAgBPAiAwebAgoAApwAKwAAxQDNhQB9kgEvAACFArWJAE2FAAPaAj8AApoD9wIAIAOFAJGeAwcCBCAA1gLBAATVBDPYArmPAnQAAokAMfAgATkAAIMEj40CjZwAbwABmACPAAOHBOvwJATFAgQgAI8AeYcFW5wCYQIEIACQAMMAA4UEjZQFm8QAtJQFTQIBIADTBRWaAGsAA48AiZ4EG48EzAAEjQQhwwS3kQRdngJdAAGHAC0BIALwIgJvAgIgAMcDQfAgApPUAEyJBEGeA2sEACAAIACKAIf/EgAgASACIAAgAyAEIAUgBiAHIAiPAAOYAAMBAaBBAyACASAEWCAJCCABIAUgAaAAIMUARAEBoPgxADIEBiABoALEAHsAAIQAuwEBIFQJYIMAgAAHgwCFxgC7BAGgACAB8CwAEwgBIAggAaAHIAeGATfwJwBAAgEgBYgBBQIBoAbGAUUBAaDwJwCAhwC4hQDCAAWIALXwJQDAiQD2hQCCAATGAMUBAaCKAQDwJAEbAAGMADkBAaCfAUCOAXCQAHefAYCOAbCQALedAcCPAe6RAPabAgABASCKAi6cATGPAkaDAMqDAMCIAm7wIgFviwGCAQkgwwC8AQEgiAKu8CQBr4kBxAcCIAggByABIIcC7vAlAe6EAgRFIAkAYIcCNgAG8CYCLwEBoI0AEAAG8DACZ0gJYPArAqqSAJbwKALpGAkgCSAJIAkgCSAJIAkgCSAJIAkgCSAJIAnwJgMrjQASjQRY8CEDblAJYI0BsooEyPgoADeLAfSIBQhUIAmMAjOHBUgCByAI8CwAA4cAeIcFiFgJYIUAugIFIAH4NAA3AAiGAPkABlwgCYMBO/g4BvuGAAiDBsf4PAd/gwDIXAlgAQQg/0EAIBoB4AJgAiABoAAgAyAEYAXgBaAEIANgACAG4AdBoAgG4AfgBqAAII0AAEQAIAIGYAdBIAgAYMMARAsDoATgBWAFIASgA+CEAAAFYALgAqABkgA7QwAgjQAMjwAcmwAAhgB6jABNiABc8CQAOYMAPAEAIPApAI6UAI4AoPArAM6LAF6EAATDAEWMACnwIwB+iwA+gwAWjABqmgC/lAGIAqAD4PAhAAwBACCXAcSDACQAAJcATfAiAAEAAYQA/YoBoPAuADWDAJoBACCIAeDwMgGFiQAsAQAg8DMBxIsBxvA0AgSKAA/wMwJEiwBO8DMChI0AHIgBbPAqARGRAeKQAU7wMgMd8CUBkpcDRPAhAL6FAD6bA4SLAByTAC6DAAydA8SGAF6WAGuDAMDwJQQ2lQCsgwAahgBemgRNAQAgjQJEiwAqAwAgACCfBIiPAP6NAGoCACAA8CAEyYoAWpQFoY0FCvAiAP6KAO2DAPyRBUqdAM6NAI6NBtKFAvafAJqGBwhOIADwIgDfEQAgACAAIAAgACAAIAAgACAAIPAxAtILACAAIAAgACAAIAAg8CUBxkUAIP9VACABAeBLACCPACwAAoQALY0ALAID4ASIAC2FAFiXAGIDBeAG4I8AaAMC4AAgmwBeCAAgACAAIAAgB5QALQIF4AaGAC0BB+BNACACCOAJiAAtkwDqAwjgCeBVACCZAS4DAuAAIIoAnvAkATEBAeCLAIyMAIqcAREIACAAIAAgA+AE8CABMQEB4JcBKgEH4JEBGAABlACpAAeSAJ2DAQ6JASibALIDCOAJ4IoBvADg6DIAIAEH4I0BFJsBzgEAIIMALJkBIpMCZgMAIALghwCwAgPgBPAwAp+TApyRAYYDAuAAIIgCNJ4Au4cBxJUBugID4ASKAinwNwEmAwAgACDwIwEuAAeQAhcAB/AqATECCOAJmAM1AQHghgCiAODwJQF8AAeUAF0CBeAG8CQCk5UBLpcA8AMB4AAgjwPO8CkEGgID4ASHBN+FAJcA4PAjASSRANACBeAGigCdnQPMnwEuAgXgBvAoA2kBB+CbAcoBB+CTARYBAuCfAzyIASiMBCPwJwKWgwAsAQAgigPO8CQFYwoAIAAgACAAIAPgBJgAXQMB4AAg8DkDagID4ArwWAKf/x8A/wH+A/wH+A/wH+A/wH+A/wD+APwA+ADwAOAAwACAAJ0AAh4AAP8B/wP/B/8P/x//P/9///8BAAMABwAPAB8APwB/QQD/jgA/AQAAjQBQjwBwAACOABCPAFCPAC8O/wD/AP8A/wD/AP8A/wD/jwBwAP9H/wCQAH+OAAGQAJCMAAOSAK6OAEGSANCLAGOSAH6PANEM/v78/Pj48PDg4MDAgJAAn4wBkpIAvQ4BAQMDBwcPDx8fPz9/f/+SAN+MAdCQAP+QAZCMAAOSAa6OAEGSAdCPAGOMAdFH/wAwAI8BAQ4AAAAAAAAAAAAAAAAAAACNASDRAqGQAUAOAAAAAAAAAAAAAAAAAAAAkgFgDgAAAAAAAAAAAAAAAAAAAJABoIsAEwAAnQMikgG+kQBRCwD/AP8A/wD/AP8A/5MAf4wAAQD/jgCQjQBCAf//jwBSAACOAH8AAI4DsEf/AJMDcYsAApAD8I4DwQAAkgPQiwBQAf//jAGQkAP/jgHSkAQfkARwjgPBnwSQLwCNBEAB//8zAIoEZAAAkAOwDQD/AP8A/wD/AP8A/wD/kABR/0EAIAIBIAFLIAACIAIg0QAgAQMgxQA0AwQgBCCGAADMADsCBSAFyAAfhwAgAgYgBoMAV4MAR5AAMwIAIACYAEcJACAAIAAgACAGIM0AqAIHIAddIADwJgC3AQggxQEeAgkgCU0gAAIgCiDUAUaWAR2LAGgAC4MANwAg3wFIBgAgACAMIAyTAW1TIADTAa2WASfEADYAIJ8AAAIAIADwKAH9Ag0gDdwAswYAIAAgDSANSyAAnAJlAg4gDscCrVQgAIMBqQEgAMcCyVMgAAMgCyAL+CwDAcgDMNYDN5MABgINIA34KANplgN+8CAAs4wABMkBJYcAq/AqA9UCCiAA+CIBJZgESJ4BhwIFIAWXBEOaAzcECCAIIADfBKXwJAS5EAAgACAAIAAgACAAIAAgACAAhQKJiwG3lgTXAgogCokAd8kFPfA/BS8PIAAgACAAIAAgACAAIAAgAMMEoVkgAIMAZ48Aj5oC+4QAIN4AtwIKIArwIgYNmAEm8CQBhQQAIAkgCehDIACUAnEEByAHIACNAHeJAzGNBinwMQc76CggAAAg/ycPKPBCAPBHAA9DAPBHAP8AAEMP/0Pw/y8AQw/wQ/APR/8AjwBAR/8AjwAAjgBgsAAPRwD/zgBv0ACgP/9BD/BBj/BB8M9B8O9BAP9BgP9BwP9B4P8JDwAPAw8PHx//P0H/f4MAjwMD/w//iAFHBP+Pgc/DK/8Bgf+MAWME/w8Pz88j/wH8/CP+BP//D/DPQfD/APikAVjIAV8DP///H8QBVwAPhwGghgGpAf8PowGQAv8f/5gBSALxz/OcAWSMAZGxAU6LAMBB/39FAP8Cf/9/iAIfA/EB8wPLAEMCAf8DxQG/AB+jAYgp/4MBRwB/igF1kABADv8A/wD/AP8A/wD/AP8A/4sAYAP+//7/rwIwiADABYDwwPDw8LACT4QCb/AiAmUC8f/xhABHAgf/B6QBNwABxgJZkAAArQBBkAF/QvD/APgo/wKPj8+sAeMC8f/zjgFzBQ8PDw8fH6kCeIMB44gBxwL/Dw+JAmDDAYsE8P/8//7JAV+oA4/wIwIIgwAsL/+HAGDXBAeQAIAO/////////////////////+i/ACAAAUMgAkMgAUMgAwMgASAEQWAFASAERSABQSAGACDNAbIBB2BBAiAAB5IBiUIBIAAIQeAJAqAIoJcBqgAKQWALASAKmAHJAQzgQQ0gAQyg2QG8BAEgASAOQeAPAqAOoJEB0EENIAMNIA0gnQIqARDgQREgABDwOQJPAGCEAooEIAEgEmBBAyAAEvAuAlkADkFgDwAgwwJIABNBYBQBIBOWAlkBFWBBBiAAFVQgAY4CYQAWQWAXAyAWIApB4AsFoAqgASAYQeAZAqAYoEYBIAAaQeAbAqAaoNcDagEH4IQBxASgASAc4EEdIAQcoAEgHkEgHwJgHmBBASABIOBBISAAII4DnwAiQeAjAqAioIsBwEMdIAIBICRBICUBICSFA9MAYIQD2o4CXwEm4EEnIAEmoIgCAI0D/wCghAQOAOCEA5RBYBsAIMMDmAEMYIMCJMUCIgEmYIMEMAAmjAGjiQQCAB5BoB8C4B7gRgEgAAhBYAkAIMUB4gAiQWAjASAikwR1ViABASAoQeApAqAooOl/ACD/BwBgASACYAEghwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAAhwAA8/8AAP8DAGABYEECIIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAIcAAPP/AAD/GwAgAGABIAFgAiACYAPgA6AEIARgBSAFYAYgBmBBByAXCCAIYAngCaAKIApgCyALYAwgDGAN4A2ghwAAQQ4gQQ8gQRAgQREgQRIgQRMgQRQgQQcgQRUgQRYgQRcgQRggQRkgQRoghwBAGwCgAOABoAHgAqAC4ANgAyAEoATgBaAF4AagBuCEABwVoAjgCWAJIAqgCuALoAvgDKAM4A1gDYgAf18HIIMADMoACoQAM8oAMoQAIwIIIAiEABvKABoAYIcBAMYATvg4AH+DAIzKAIqEALPKALKEAKMCCKAIhACbygCaAOCGAYDwQAC/8C8AEI8ACPg2AXaHAE/wMACPjgCIAODoIQcgiwEs8C8BAMYAXvg4An+PAajwLgGA8EAAv/AvAhCPABj4NgN2hwBf8DACj44AmF8gBwAgkwEY8CsDBMYAbvg4BH+PAZjwLgOA8EAAv4cEEPA3AADHBXbwNwBAhgSQ8DcAf18gBwAg8DcBCIcBCPg+AH4AIPA3AYiGAYjwQAC//xsAIABgASABYAIgAmAD4AOgBCAEYAUgBWAGIAZgQQcgFwggCGAJ4AmgCiAKYAsgC2AMIAxgDeANoIcAAEEOIEEPIEEQIEERIEESIEETIEEUIEEHIEEVIEEWIEEXIEEYIEEZIEEaIIcAQBsAoADgAaAB4AKgAuADYAMgBKAE4AWgBeAGoAbghAAcFaAI4AlgCSAKoArgC6AL4AygDOANYA2IAH9fByCDAAzKAAqEADPKADKEACMCCCAIhAAbygAaAGCHAQDGAE74OAB/gwCMygCKhACzygCyhACjAgigCIQAm8oAmgDghgGA8EAAv/AvABCPAAj4NgF2hwBP8DAAj44AiADg6CEHIIsBLPAvAQDGAF74OAJ/jwGo8C4BgPBAAL/wLwIQjwAY+DYDdocAX/AwAo+OAJhfIAcAIJMBGPArAwTGAG74OAR/jwGY8C4DgPBAAL+HBBDwNwAAxwV28DcAQIYEkPA3AH9fIAcAIPA3AQiHAQj4PgB+ACDwNwGIhgGI8EAAv/9EACATASACIAPgBCAF4AAgBiAHIAigCeBBACATCaAI4AdgBmAAIAWgBGADoAJgAWBIACCVAAoDCiAKYPAjACCXAEgDCyALYJcAYPAjAHwDDOAMoJkAoPAhAL5BACCbAODwIQEAnwEeAQGgxgAyEWAAIAagB6AIIAlgACAKoAugDIgANREMIAvgCuAAIAkgCGAH4AbgACDGABIE4AHgACCbAYDwIQGgnQDCAw0gDWDwOQEiBQ0gDuAOoJ0CIIkADJEBigMNoA5gwwJekQGkiQAqiQKC8CsCSokCtJ0CwkEAIJ0C4J8DAp8DHgMFYAAglwKIhwNclwKggwG0AATwIAN/nAOkAuADYIUDwPAvAoiHAbSHAYLwLwLIhwG2iQGAmQKK8DkBpAMNoA3gmwHi8QMA/p0BwPAhBeKdBgDwIwYimwYA8CUGYgMAIAAglQGA8CcGogMAIAAgkwGA8CkG4gMAIAAgkAGA8CwHIQEAIJAACvAkACMHACAAIAAgACCTAAqfACL/RwAgBwEgAiAD4ATgQgAgAwUgBWBCACAHBKADoAIgAWBOACCPABACBiAG8CoAH5EATgMHIAdg8CcAYJMAjAICIALwJgCflQDKAwjgCKDwIwDglwEIAwngCaCXASDwIwE8QQYgmQFg8CMBfp0BnvAjAcCdAZ7wIwICAwYgBiCVAWCfAcQDBeAFoJ0B3J0CgoMAGp0CoJ0CwgMKIApgmwLgnwMAAwsgC2CZAyDwIQM+AgYgBpwDX/AhA4CfA56DAqAHB6ACIAhgCWCIApYFYAAgCqALiAKhBgvgCuAAIAWJAh0AIMQBHgDghQLamwQA8CEEIAEAIJ0EQPAhBGKdBICfBGQBBGCdBH6eBOICIANgnQUAngUiASACngU/BwYgBiAGIAYglwVqAQGg8CMFgJgFqAHgAJoFv/AjBd4BACCbBgDwIwYgnQZA8CMGYpsGQPAlBqIDACAAIJQFwPAoBuEDACAAIJMFwPApByIDACAAIJEFwPArB2IDACAAII8FwJ8G6P9HAKBHASBHAKBHASBHAqBHAyBHAqBHAyBHBKBHBSBHBKBHBSBHBqBHB6BHBqBHB6BHByBHBiBHByBHBiBHBaBHBCBHBaBHBCBHAyBHAiBHAyBHAiBHASBHACBHASBHACBHASBHAKBHASBHAKBHAyBHAqBHAyBHAqBHBSBHBKBHBSBHBKBHB6BHBqBHB6BHBqBHBiBHByBHBiBHByBHBCBHBaBHBCBHBaBHAiBHAyBHAiBHAyBHACBHASBHACBHASBHAKBHASBHAKBHASBHAqBHAyBHAqBHAyBHBKBHBSBHBKBHBSBHBqBHB6BHBqBHB6BHByBHBiBHByBHBiBHBaBHBCBHBaBHBCBHAyBHAiBHAyBHAiBHASBHACBHASBHACBHASBHAKBHASBHAKBHAyBHAqBHAyBHAqBHBSBHBKBHBSBHBKBHB6BHBqBHB6BHBqBHBiBHByBHBiBHByBHBCBHBaBHBCBHBaBHAiBHAyBHAiBHAyBHACBHASBHACBHASD/QQPDQcPAQfzAQf/8QTzMQf/zQf/MQfz/QQM8QcP/QTz/Qf8AQTPzI8wiM8QAMEE/z0E88EHD8EH/AEHPM0Ewz0HAP0EA/0E8z0E/80HD80H/P0Ewz0HPMwA/xABDAT//QQA/AsD/wEL/PAI/PD9BAPNBAM9BADNBwM9BDMNB8MBB8DBBD89BzPxB8z9B/M9B/DNBDzBB8M8C8D/whQB4QTP/Acz/xADVAj/MP0LMAwHwA0HwPIQAygIzzDOlAFMBzAOkAJuEAKAFw/DD/D/8xACNQQD/QcA/AjzPPJAAu0EPP0HMM0EzzEHMM0HzzAMPwA/AiwCkQf/MQT8zQc/MQTAzQQPwQQDPQTD/Ag//D4QA0EEM/EEz80EMzEED/0HD/MQBhwH8/6QAtwD/xgAbQfz/QQ/AQfPDAvw8/IQBDkEzzEEPMwIPzA+kADtBDz9BMD9BwM9B/wBBwMyEAJAB/AClAFsCDzwPQT8zpABoowANAvM886sAFP9H/wBBAAFBAANBAAdBAA9H/wBHAP9B/wFB/wNB/wdB/w8vAC//LwBBD/BBH+BBP8BBf4Aj8CPgI8AjgEcA/zD/jgBBIwEjAyMHIw8//0EPAEEfAEE/AEF/AEEA8KQAGALAAMCjABAwAEb/AAD/jgCA8CABHwAAJgDYAXeLAQQC/wD/Qf8fQf8/Qf9/Iv/RATEC/wD/QQH+QQP8QQf4I/8j/iP8I/iPAaAjHyM/In+HAauMABCEATIC/gD+pAEHQfgAjgHBLwBH/wAvAI8AQI4AEQAAkAFAjgERjgEAkAEQkABAjgARkAHgjQGSAACQAiCPAhGNAgGRAhCOAaGOAZAx/80BPgAATwD/LwBH/wAv/0cA/5ACoI4AkUf/AJAA0A4A/wD/AP8A/wD/AP8A/wCfAnCTARGLAySQAdAOAP8A/wD/AP8A/wD/AP8AjgHw0ABAnwLwkgMRDAAAAAAAAAAAAAAAAAAw/0cA/y//TgD/kAF+R/8A/z8AL/9HAP8v/y8AT/8ACgP/B/8P/x//P/9/JP8L/AP4B/AP4B/AP4B/RwD/AwH/D/9F/wAD/gHwDy8AP/8oAEIBAAED/44AgAr8//j/8P/g/8D/gMMAtIwArwP/Af8PK/8C/v/wMP8NAAMABwAPAB8APwB/AP/RAPAsAAIBAA+KASRBAf8AA4kBNEH+/wH8/0f/AC//CwMDBwcPDx8fPz9/f5QAjIsBcgIBDw+XALAlAQEDA4kAtEH+AQH8Ay8AS/8AhgGIjwIPiwD/lAHLjgEg8CEB744BkYoBwJQBC5AB4I0BMY8BAAD/igFQlACbjwFwiwCAlALMCf8A/wD/AP8A/wCPASwD//7/8JABgI4A8NEAgA4AAAAAAAAAAAAAAAAAAAAv/4QBKYkBADD/Ag//fyv/lwGAhwGXR/8AMP+NAwAA/03/AI8CjAP/AP8AMP8AP6MBlwH/f+Qo/44DgFf/AIwCv5QETI4B4UcA//9KAP8IAf8H/x//fv/4Qf8OAf8fJP8B7/5BH/xBHP8APyT/Ad/8QT/4QgD/CAP/D/8///z/8Eb/AA3/Af8D/wf/D/8c/zj/cEH/4I4AUQQH/x/8H4QAO0F/8EH/4IsAhEH/wAABzAAXAsD/A4QAXwYO/xz/eP/wkABtAgH/AYYArwAHhAAfAByOAMEAA4gAzwcP/h/8f/j/8JAA344AUAID/weGAPUAP4MA/QHgAa4AUYsA1AIc/zhC/xwB/zsl/wL8P/iFAEaDAEuwAQ4EAP8B/wdO/wAB/wODABgFf/7/+P/gpQChQhz/AO4l/wIf/g+NAVIBP/iPAWKNAaIB/wCNAbIC/g8DjQE/jADxkwC7jQEiAf/AjQFCADiIANMCHP84hAC7jQCCAf/AjQCSAv+AAYsAr5AATQADiQB3hAAbAOCOACEBH/yNADIBP/iNAEIBwP//HQAgAaABIACgAiADoAQgBaAGIAegCCAJoAogC6AMIEENoBkMIAugCiAJoAggB6AGIAWgBCADoAIgAKABIMMAOpcABAENIMUAWMMAJgINoA2YACObAETDABbDAG6bAGCbAITDABLDALabAKDeAN4AoN4A/gAg3gCeAKDeAL4AIN4AXgCg3gB+ACCcAYQFIACgAKAB3QB/mgHFgwAIAgOgAtwAP5sCBIMADMMCMpsCIAIHIAbcAl/DAnqbAmDeAl4AoN4CfgAg3gIeAKDeAj4AIN0B3kEMINwB/AAgnQHg+CADYPAgAh+eAgDwIAJfngJA8CACn54CgPAgAt+eAsDwIAMfnwMAAA3fA53dAd3wIABfngBA8CAAn54AgPAgAN+eAMDwIAEfngEA8CABX54BQPAgAZ+fAYDcAD4BIA3DA2OaAf8BAKDwfwAA8H8GgP9BACACASACQSADQSAAACCPAADIAA4BYAGPABuIAAsCAiADgwAHiwA7kAAXgwAmjwBchAAAywBFASABjwB/zQCPAGCPAJ4CASACjAAJhAC+mACTAwMgAmCPAOCbAAgCASACnAAnAAOeAEUAAoYAZZsAXIYAiJwAfwECYJ0AngEBIJ0AvoMA7JIA4IQBA/EdAAADASABIPA5ASKGAxwAIPA1AWQAAYoAk/AxAaYCASAB8CgA04QAjgCg8CwDygDgkQOYAQKg8CgDjADg1AGIAiACoPAkA04A4NgBSgIgAqDwIAMQAOCMACqDBAfwKAP7gwQ0kQQoAQKg8CcEPAEC4JAEZocEh5MEf54EowEC4IsExJIEwJ0E4wDgnQP6AgKgA4wFI/AxBCgBAqCJBWTwNQRmAQKghQWm8DkEpAMCoALg8R0E4v8eACABIAIgAyAEIAUgBiAHIAggCSAKIAsgDCANIA4gAN0AHQMgACAP8DoAAQAPlgA9ABCJABX4NACdAgQgEYcAF/g0AN2DADQBEqCJABoBEqD4KwEWAROghAA0igAZhQAEAROg8CUAbIcAMgAUgwAb+DABnQEVoIkAMgIWIADLAd0CIBWgngBukQBt+CwCHdIB0PgjAl34LQGZkgBxxQEY+CcBUtECygMMIBGg+C4BFACgyQMEARSghACkAKDwKgBqAKCDABYBFKCDAHwBFqCGAGL4MgCTBBagACAOxwO7+FUAk94EHfB/A74CACAPgwFh8DIDhQICIA2HAHvwNgTDAAGLBPvwLgDnAgsgAvhSAsPwJAWM+DsCS/BuBY0CDiAA+DIGnYUBEgAMhQaZ+DIG3QQJIAogA4cAF8cHHfDYA8f/DwP/B/8O/xz/OP9w/+D/wP+DAAAHD/4f/D/4f/CDAAsOAAEAAwAHAA8AHwA/AH8BRv8AAf8BMP8OAf+Af8A/4B/wD/gH/AP+kAA+CwMDBwcODxwfOD9wf4QADIMAcQoOHBw4OHBw4ODAwIQAEAX/H/8//38k/wAAzAAtAYCAvwAw0ABfjQCQ8CAADwb//v/8//j/hAAbA/+A/wGNAN6yAJ6NAKGwAR/PASAAAY0An5QAXwYPDh8cPzh/hAAKjwBwAP/NAWAw/48AkIQBkAUPHx8/P3+DAOuLAOA1/4kA4ZQB64wB8AL///+TAOCLAASLAHCTAAyOAN6PAN6RAN4AAZ0B7wEBAY0B4IwC0JIB+p0C4gH//4wC0AB/8CACrwH//4wA3wL////wPgIRjAKQ8CECrgD/nwMwiwMA5CP//0MAIAEBYEECIMgACEEgAgAgwwAalwAAhwAIAQPgQQQgBAOgACABwwAJiAA/nwA4hwBIQgQgAASEAA/LAIqfAHhDACABA2CEAEICIAHghAAKAKCFAMAAA58At4gAxwQAIANgA4wAFYQBAp0A94oAFfA/AACJAPgCAWABigEVnwF4hABIkgAVxwHGjgG48CAAD4cAUJYAKPAgAE+HAJCUAGjwMgCNgwCg+CMCmocA6J8A4JYAwMgBP5sBIMMDIvAnASCGAeDFAf/wKgHdjgGQiAGPhgOA8CABj4wB0IoBzYQDwI8BzfBCAz3GAwaIAE+fAiCWAgDIAn+bAmDDBKLwVwJghgLI8DgCv58DCPFnASCFANAAA/AgAKeXALiGARCYAOeUARDPA1mPAy3wOgNdhwN48DcDoPAnA7j/KgAEATA3MDaKAAEEADeANoArAAIGAAYtAAG2AMgAPSIGAt4A2IwAIQLeANiXACAHwMDw8DY2BgYvAAADLgABAwOGABUFBwAGGAAYOwAGAQABBgY2NuQ7AI8ALIcAzAIDAANBDAAEMAAwwMCnAHIBDAwiMAEwwK4AjtkAygEMDKMAeqcBTgAD0QCPBAAMAQwBqwAiAm0ADYgAlwIDAwCEAScBwDCHAaAjDAMwMPDwxQCaiAFwPgABDAyXAcCIAYrUAaMDDGwM7KsBTgRsAewBgPAmACEmAAIbYHusAHwEGwB7AGA9AAMDAw8PlACQjACVhQF2hACqAmAA4DEAqALIAgEAALEAjo0BdrIB7gAB9CsBIgEDA8wAeQIAAwP/GAN4B/AP4B7APIB4APAA4AB7APcA7wDeAL2GAA8TAwCBgMDA4ODw8Hh4PLwe3nsAPQClAAoCAwABIgCnACgH8Pfg78DegbyDAAQBPYCJABAGBwcDA4EBwMUADwgAPAAH8AN4AbyoAA8APYUANAKDgMGGACWFADMDgAPAAYUAaAAHjQAfADzJAFmlAASkAGrEAHSjAHABgT2MABMM3gC9A3sH9w/vHt48vMQAK4gADgABhwDfhQCBAQDBhgBnAACQAQAAAMwAPwAAkAEghAEiqAAjjgEg5CAApwBIhQC2AfgDLwClAOoDg4PBwYUAJo8BAIwAYhKAHsB4e7y93t7v7/f3e3u9vd7epwDIpQDgAfj7iQHWgwHWAfv7/yYASwD/KAAo/8QAH8kAKEMP8ELw/wHw/y8AQg8AAA+oAD/IAB+FAGAoD0fw/0MA/48AYC//Qw//QvD/sACvAP+GAJioAMdH/wDGADcA/0v/AIgAYCbwhgBxRwAPkACnyACGAgAAAMsBY4YAmMgBUI8AII4BAIgAP7cA6I8AYIgBKIUBUQD/jgBg+DABIIYBILgBZ5AAYELwAIgCL48AgM4CP5EAHwb/////////sAIwhABJAPBH/wCQAJ+HAlGHAgjXAZ8H//////////+QASCFAVGnAMfkIP9HD/Av/y8PR/D/Rw/wRwD/hQBgAA9HAPBLAP8wAIYAoNEBgMUAZY8C3zEA1wA2BgAAAAAAAAD/Qw8AQ/APRwD/iAAAJvBD/wBDD/9DD/BC8P8A8Cn/hQAxqAAnQ/D/QgDwiAAnAPCPAGDIAD8lAAAAjgAA0QAgjgBhrwCojwBARw8AiABgpQBBiAEGQgDwAQDwhwAAS/APkADgDw8PDw8PDw8PDw8PDw8PDw+FAAEAAI8AiCb/kQA/hQAxAACQAJiEACkA8K8AOADwjwEAkAFwhgBhR/D/sABwhQBJAP+YAbCGAEnOAd+RAd/FAC6oAA8AD44BYbACWIYAQZABaAYP/w//D/8PkAHghgBwpwEAlwBAhgCYAACXAeCGAXiwAne/AmjHAnaGAUiYAd+GADCYAJ+GAliQAd+IAxAmAP8v/y8ACzPDZ4fHB48PHx9/fyP/APxBAPgFAPAA4ACAJAASDw8BAfAA/gAP8AH+8P/+//AA/kUA/xYAAQEHBx4fOD8xPmd4ZnjM8AH+B/gf4EE/wEF/gAD/MQBG/wAA/0czD0f/AAEAAMUAwAIA/wAk/0f/AIMAQAXgAP4AH+CVAEpCMw8BGwdCmYcBzMND/wBCfwAAPygAIwEBAwPJAOFBAf4DA/wP8EMzD/AgAQgGAAMABgEMA4UBNAMH+A/wQR/gAT/AgwA8rABEAvB/gM8Am6UA5JUBigEMA0IZBwEbB0IzD4UAeAF/gI8BuAEzD5UBygEzw0KZ4QHZ4ULN8QD8RgD+AAD/EB4/WH9XWF/TPueNdo+E/uT/QX+/4CB/PP8Y/wj/iHf8AzP65hV/cY//P8fFAB8c4v7j/Ob4j/BBB/gVAP8d4v8ALwfVKDvjzs89Ht8wP+DCw8MAOwPjHM8wQh/gHSP8BxtxfQnN+fTf4L/Pu9w22OMcgf7x/vn+//zx/kHg/0FVMwuqZm4MvljemLe57rFB8A8H4R/OMd4hnmFBv0BBBQcLDg47Psf+H/zu4fGPQfgA4DzxAMEAAQADAB8AfwALDwsOEx4VHDY97v0++d3D8ADxAOEA4wDDAAMABwA/AFWZZbnpsarzOpN+W/uZvnjhQf7BCv4D/CPce4T5BrsE/wcAoAHgAuADoIcAAI8AAAcD4AKgAaAA4IcAII8AIAcE4AVgBuAHYIcAQI8AQAcHIAagBSAEoIcAYI8AYAcIYAngCmAL4IcAgI8AgAcLoAogCaAIIIcAoI8AoAYMIA1gDmAPhwC/jwC/wwDHBCANIAxghwDgjwDg8P8AAPH/AAAHDKAN4A7gD6CHBACPBAAHD+AOoA2gDOCHBCCPBCAHCOAJYArgC2CHBECPBEAHCyAKoAkgCKCHBGCPBGADBGAF4KMAQ4cEgI8EgAMHoAYgowBjhwSgjwSgBgAgAWACYAOHBL+PBL/DBMcEIAEgAGCHBOCOBODw/wP/8f8D/wBg/w0AIAHgAmAD4AOgAiABoEkAIJ0AAg4E4AUgBqAHYAcgBuAFYASQAA2fAEAMBGAIoAYgB+AHoAZgCNIAQZ8AgAsAIAFgAuADYAMgAqDUACKLAMFRIACYAAHwIQAAAwAgACCZAECfAEAFACAAIAAgmACA8CIAnwQAIAAgAJoAwYsAwvAxAR4ZACAAIAAgACAAIAAgACAAIAAgACAAIAAgACCOAWrwMAIRjAGq+DMCRYoA4QAB6CwgAPDbAgXw9AERFAAgACAAIAAgACAAIAAgACAAIAAgAPCyAgWLAALwMQTgnwBAnwACkwCA8C0BYJoAwgAg8EwChPESAgP/AwAgASCDAAAWAiADIAQgBSAGIAcgCCAJIAogCyAMIA2ZAAUFIAAgDSAAhQA3mgADmQAihQACBAwgDSAMmgBDmQBiAAKEAAUECyAMIAuaAIOZAKIAA4QABwQKIAsgCpoAw5kA4gAEhAAJBAkgCiAJmgEDmQEiAAWEAAsECCAJIAiaAUMAB5oBg4YADpwBn5sBhAIGIAeDAfecAV+bAUQCByAIgwG3nAEfmwEEAgggCYMBd5wA35sAxAIJIAqDATecAJ+bAIQCCiALgwD3nABfmwBEAgsgDIMAt5wAH5sABAMMIA0g+34DfvB/Bn/4gAb//w8A/wH+A/wH+A/wH+A/wH+AIgAMAQADAAcADwAfAD8Af0cA/5EAEA0B/wP/B/8P/x//P/9//5AAEI4AEw/+/vz8+Pjw8ODgwMCAgAAAkQAADAEBAwMHBw8PHx8/P3+SAB+MAJKQAD/wIQCQDgAAAAAAAAAAAAAAAAAAAJEAQQ0AAAAAAAAAAAAAAAAAAI8AYQwA/AD4APAA4ADAAIAAlAB+iwAU0QAxjgFRkgDAiwFTkQARjAEwkQFfVwD/L/9HAP8vADD/RwD/Jv/WAlfkQP8/AFf/AEcA/0f/ADD/zAAwkQEPAADOAz7/DwD/Af4D/Af4D/Af4D/Af4AiAAwBAAMABwAPAB8APwB/RwD/kQAQDQH/A/8H/w//H/8//3//kAAQjgATD/7+/Pz4+PDw4ODAwICAAACRAAAMAQEDAwcHDw8fHz8/f5IAH4wAkpAAP/AhAJAOAAAAAAAAAAAAAAAAAAAAkQBBDQAAAAAAAAAAAAAAAAAAjwBhDAD8APgA8ADgAMAAgACUAH6LABTRADGOAVGSAMCLAVORABGMATCRAV9XAP8v/0cA/y8AMP9HAP8m/9YCV+RA/z8AV/8ARwD/R/8AMP/MADCRAQ8AAM4DPv8NAKABoAKgA6AEoAWgBqCNAACDAAANAeAA4AbgBeAE4APgAuCNACADAeAA4J0AAgMCoALgnQAgnQBCAwOgA+CdAGCdAIIDBKAE4J0AoJ0AwgMFoAXgnQDgnQECAwagBuCdASCdAUIBAKCdACIBBuDxvwAADQYgACABIAIgAyAEIAUgjQOAgwOADQBgBmAFYARgA2ACYAFgjQOggwOgAQUgnQOAngOiAmAEIJ0DwJ4D4gJgAyCdBACeBCICYAIgnQRAngRiAmABIJ0EgJ4EogBgnQOCAQEgngTiAGDxvwOA8H8DgPB/AUD/PwAPAQADAAcADwAeATwDeAfwDzAAQv8AAP/GAEc4ACb/kQBHhgBBS/8AhwB5hwBpjgCAkAB/RwD/Fg8PHh88P3h/8P/h/sP8h/jwAOAAwACAMAAv/0MA/0cP8C8ALw9H8AAPAAABAQMDBwcODhwcODhwcEP/AAb+AfwD+Afw0ADgL/9HD/BH/wAwD0bwDwDwhQFiCQ8PHh48PHh48PBDAP8GAf8D/wf/D5EBHw7/AP8A/wD/AP8A/wD/AP8vD0fw/wEAAIcAIAQfAD8Af9EBGA7/AP8A/wD/AP8A/wD/AP/kL///R/8ALwBB7yAC7+APQwD/AABBHDwAHCb8IgCIACcDAAD//8YAQgAAIv+IAEpH7yBHHDxD7yAD4CD/P4cALEIfPwAApAA7Qu8cAA9C/P8BAP9BADxDAPwAAIgAPI0AUssAR4UAnwYf7x/gH/8AswCsR+8cRzwAQcsMBsgPzw/AAMCDACdDADCsALeFAFADAP//AM0BSCMAQcsMQQsMA/v8A/yHASwC8ADwiAFXR8sMRzAAQcswBMgwzzDApgFpjwDvhgBEAQAAhgFJjwDPQcswQQvwA/sAAwCzAaxHyzBHADz/AwAgAaCDAACDAACDAACDAACDAACDAACDAACfAAADAqADIIMAQIMAQIMAQIMAQIMAQIMAQIMAQJ4AQPA+AAEBACDwPQBCAQKg8P8AAAIEIAWDAf+DAf+DAf+DAf+DAf+DAf+DAf+fAf8BoAXwPgH/8H8CAAMGIAeggwMAgwMAgwMAgwMAgwMAgwMAgwMAgwMAgwMAgwMAgwMAgwMAgwMAgwMAgwMA8D4DAACg+H4DfgCg9D4CAQAg9D4B//B/A//4PwD/AKD4fgC+ACD4PgE+8P8E//CABP/wfwCA/0f/AC8ABucAjwAfAH9DAP8IAAAYAHAA4ACAJwBB/wALHwADAOAA/ID/8P94JAAO4AD8AB+AA/AAeAAP8P8HIv8B+PwiAAYDAP8A8AAHowBBhQBqAfwAQQC/AwA/AH+IACVBAEADAMAAgIcANoQAIgYBfwP/Av8GQf8EgwAyBgGAA4ACAAZBAAQAAEHvEAvnGPMM+Qb8g/7h/3BBEQARGAAMAAYAgwDhAHAAAf7wD/4BhQBAGA8A5wD+AA8A4QD8AA4A4wDxABgAjwCfAD+NAKUCYAHAiQC2/w8ADwAfAD94f/j+GBwYGJAQKQAE4ADgAOAuAKsAHgQBAAMAB+QqAAQBAAEAAZAALyIMGxwPP08/wD7APPgA8AAMAxwDPwB/AP4A/AD4APCFADUAAaMANqYAagMHAAMBtAA1AAHOAGoBAQCRADsBBASNAC8LBAMGDgcfJx9gH+AehQCaAAGDAAGMAJQBAwOJAMoCICAHyQA+pAD7AQAAywEtjgDNAQMHjAA+AwICBgaLAMACAQMBhAAuAzwAPgBBMA8TEA8AD/Dw+Pj8/P7+f38/Px8fDw//5C8A4CwBAAMABwAPAB8APwB/AP8AAQEDAwcHDw8fHz8/f3////4A/AD4APAA4ADAAIAjAA7/Af8D/wf/D/8f/z//f/8vAA0B/gP8B/gP8B/gP8B/gJAAbwAAjQAwAP/kIQCOADCPAECPAIAFB/iD/MH+qQBmR/8AhwAwBx4BPAN4B/APmQCghQBAiQBABT4/fH/4/4kBVgzw/+H+w/zw/+D/wP+AQ/8AAP+FADAKDgEcAzgHcA/hHwCUANEJDg8cHzg/cX7j/JAA4IoBgQNxD+MfjwBA/0cA/y//AwH+Av1CAP8aIP9A/4D///7//f/7//f/7//f/7//fwH/Av8EQf8ABv4A/EC6iHaHADAG/u/83/q/9ooAPwUB/EW+iH6LADAC+7/3QX8ABb8g/xD/CEL/AKQALxLf3+/v9/f7+/39/v4ADwDfQP+IwwCHC/8AvwB/Hv79/bv7d6QAl4MAPAEId0OAf0EA/wge4Hf/e/99/35C/3+lAEUEfwB/gf5CgP8BePikADmIANUBB/+HAIAAiMMArwLfYA+HAJAHd/e7+9397v7/QQAgGwEgAiADIAQgBSAGIAcgCCAJIAogCyAMIA0gACDdAB6fAAABASDcAF7wIAA/AQIg3wCemwBEQQ4g3wDemwCEQQ4g3wEejQAKiQDcAgIgA4QA298BXo0ADIkBHAIDIASEANvfAZ6NAA6JAVwCBCAFQSAGACDfAd6NABCJAZwCBSAGQSAHACDfAh6RAI4AA4oCFQEIINwCXvAgAj8BCSDcAp7wIAJ/AQog3wLekQDSiQKWQQ4g3wMekAESjgFD3gNeACD7fgN+6H8gDgAg/0EAIAsBIAIgA2AEYAVgACCPAACfAAAPACAGIAfgCCAJYArgC6AMYI8AQJ8AQA4NIA7gDyAQ4BGgEmATIBSPAH+fAH8GYBUgFiAX4EEYIAUZoBpgGyCPAMCfAMAFHKAdoBFgQhggAx7gH6CPAQCfAQAPIKAK4CGgImAYICPgB+Ak4I8BQJ8BQA4FoCVgEyAmoCfgDuAoIA6PAX+fAX8Q4AAgKaAqoCugLOAt4AfgACCPAcCdAcABACDx/wAA8/8AAP9BACBBASBBAiBBAyBBBCBBBSACBiAGQSAFACDbAB6fAAADBCAEINoAXvAgAD8DAyADINoAnvAgAH8CAiACmwB/+CQAn5oAQPgkAF+aAADwIAAfQQcgAgcgB/AkADuTAYxBCCDaAd7wIAG/QQkg2gIe8CAB/0EKINoCXvAgAj9BCyDaAp7wIAJ/QQwg2gLe8CACv0ENINoDHvAkAv8GDSANIA0gDZcC3wAg+34Dfp8Bn/AkAbuaAaDwIAG/+H8Hfv8NAOABoAKgAyAEYAWgBmBDByAJCCAJ4AogCyAMoJ8AAEMHIBcNoA5gD6AQoBGgEiAT4BTgFSAW4ArgByCfAECJAB4BFyCNAAwEByAKIAufAH8AIIsAXgEY4IkATgEHIIUAWJ8AwAAL8D4AfwEK4PA9AMCDABzwOwAAgwBc8DcAQPB/AXyDAFiLAB4BByCNAAoDGaALIJ8CgI0AXgEHIIkATAAahABZnwLA8D0CggEMoPA9AsIBByDwfwAA8/8AAP8//ws+AT8BHwMfBx8ff38k/wkA/wH/A/8H/x//hAArQR//QR7+Qzz8BgcHAQEBAAFDAAMEAIODgIAjAADgQgD/AwCD/IBF/wAN/w//H/88/PDwwMABAB+GAGkF/APwD8A/QgD/FjOQXMxTz1nHbONu4WbhZ+BwDzwDPwA/QwAfBwB//z//H/8/hQA6Av/z88YAyQAPQf8HE/8D8w8+wB7gH+AP8Af4A/zD/OH+R/8AQxwfQY4PQc4PQ+AAQ/AA/wwB/wP/B/8P/x//P/9/Mv8BAP+NAAAPAAABAQMDBwcPDx8fPz9/f48AADAADv8B/gP8B/gP8B/gP8B/gC//jwAwHf8A/gD8APgA8ADgAMAAgAABAAMABwAPAB8APwB/ANEAIYwAoEgA/wAAkACAD//+//z/+P/w/+D/wP+A/wCPAGEOAP8A/wD/AP8A/wD/AP8AkABADv8A/wD/AP8A/wD/AP8A/40AAJEBLY8BAEcA/48AMI8BAI0AoNEBYf8PAKABoAJgA6AE4AUgBuAAII8AAJ8AAA8GYAegCGAJYArgC+AM4A3gjwBAnwBADwWgDmAPoBCgESASIBPgFCCPAICfAIAOFWAWoBegGGAZ4BogG+AcjwC/nwC/xwDPCCAYoBdgFmAVoI8BAJ8BAMQAjgTgEeAQYMQAhABgjwFAnwFACQ0gDCALIAogCaDEAEQAoI8BgJ8BgMYADgAgxAAGAmAAYI8BwJ8BwPH/AADy/wAA8P8AAP8GAGABYABgAcQABUECII8AAJ8AAAUBoANgBOCDAEIDA2AFYI8APp8APkECIAUFoAagB+CDAIQDBqAIYI8AgJ8AgEECIAYIoAmgCKAJxADJjwDAnwDAhAA8AyAAIAHEAQcBACCPAQCfAQAHAiAFIAMgBKCDAUQDAyAB4I8BQJ8BQAEIIMgAjATgBeACII8BgJ8BgAYJ4AjgCeAIxAHFAQIgjwG+nQG+gwAM8f8AAPP/AAD/BwAgAeABoAAghwAAhwAAhwAAnwAAAQHgQQIgAQGghwBAhwBAhwBAnwBAXwIgAAOEAH8BA+CHAMCHAMCHAMCfAMADBCADoIMA/ocBAIcBAIcBAJ4BAAAg8T8AAPC/AADgPwIgAiACIAIgAiACIAIgAiACIAIgAiACIAIgAiACIAIgAiACIAIgAiACIAIgAiACIAIgAiACIAIgAiACIAIgAiDxfwIA8n8AwPB/AMD/P/8lASMDBQcHDw8/P0L/AUH/AwX/B/8P/z8v/48AII8AIJAAMY0AMZAAL48AgfAwAGAP/////////////////////54AMeQgAE//AC4AMP9HAP/wLgDRjQCB8CAALwH//0cA/y//RgD/+CABUS//jgAg8CAA/y//nwGwHgD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wAw/58A0U8A/0f/AC8AV/8A/w8AIAFgAqADYAMgAuABIABgjwAAnwAAhQACAwTgBKCEAAgAII8AQJ8AQMQADATgBGAEIMQABgCgjwCAnwCAAACGAI+GALoA4I8AwJ8AwAAFhgC/hgD6jwD/nwD/AuAGYIUBAIYBOgAgjwFAnwFABgYgBSAAIAHEABMDBWAGYI8BgJ8BgIUBggECoIUACgAFjwG/nwG/AGDx/wAA8/8AAP8DAGABYIMAAEMCII8AAJ8AAAkDoASgBeAEoAZgjwA6nwA6QwIgCQegCKAJ4AigCmCPAHyfAHxDAiACC6AMgwDDACCPALyfALxDAiAGASAAIAEgAI8A+58A+4YACQEGIMQARgLgA+CPATyfATxBAiABCiDEAIgE4AfgAiCPAXyfAXzEAM4IYAvgDGAL4AIgjwG6nQG6hwAI8f8AAPP/AAD/DwAgAWACoANgAyAC4AEgAGCPAACfAACFAAIDBOAEoIQACAAgjwBAnwBAxAAMBOAEYAQgxAAGAKCPAICfAIAAAIYAj4YAugDgjwDAnwDAAAWGAL+GAPqPAP+fAP8C4AZghQEAhgE6ACCPAUCfAUAGBiAFIAAgAcQAEwMFYAZgjwGAnwGAhQGCAQKghQAKAAWPAb+fAb8AYPH/AADz/wAA/w8AAwAHDA4EBDAAEGAA4IDAJQAIGAA4AHAA4ADALgAAAc4ALgAB5CIADQYAAgwAHDA4EBDAAECAgwAACwAOABwAOGBw4ODAwI0APQOAgAEBvAAy0AA+CgIDBwcGBhAAGCBAhQB7CQMABwgOHBw4OHCSAHsDAIAAAa4AIp0AMA8BAAAEAAYIABwgODAwgADAiQBwAgAwQIMAG/8CAP//JAAv/0MA/wJamb0iPAN+fv/nQf/DAf+BhgApyAAfR/8ARwD/AIFBAMMBAOdDAP8AAEcA/zAAR/8AJgACGBg8hAAjQwD/ARjnQTzDAX6B0AAeEAD/AP8A/wD/AP8A/wD/AGaBQTzDABjHADAA/0j/AAMA////yACj0ACmDoFCZoGZ52ZaGCSlPNsYw8YAsAGZGIcAYv8OD/CH+MP84f7w/3j/PP8eKv8cf38/Px8fDw+HB8MD4QHwAHiAPMAe4PD/+P/8//4o/4oAAAR/PD8eH0QA/wWA/8D/4P+PACAHD/AH+AP8Af5CAP8AAJAAP0T/AAV/gD/AH+CQACAEAPgA/ACIAHcIAA//h//D/+H/hwBIDw8PBwcDAwEBAACAAMAA4AD/5CMAAgMAAMYAJiMDBQAAAwMAAMYALwEDAIgANYUAJQADyQAs0AAoQSEJKwADqampqYMAJocAV0ETQ8sAO0FUV4wAYAKgIaArAAOgCaAJyQBLAQADQRMUiQCAAQMAQRdAzQAtBgMDAwAAAAOKAFacAGACAKkAkgCAiADxAlQAVMQAZo0AhAEAAIsAlP9CACADASABYEIAII8AAJ8AAIUAAgUCIAIgAWCPADyfADyJAD4DA+ADoIMASI8Afp8AfocAgEEEIIUAiI8AwJ8AwAUBoAIgA2CEAMaDAEcA4I8BAJ8BAAEAIIUBAIcBOo8BQJ8BQIYBToYBeY8Bfp8BfokBjAMB4AAgjwG8nQG8hQAK8f8AAPP/AAD/BQAgAaAB4EEAIAUC4AKgACCPAACfAAALAaAD4AOgAeAEoAXgwwBKgwBAxwBSwwBanwBACwEgA2ADIAFgBCAFYMMAioMAgMcAksMAmp8AgAAAQSABAGCEAAYAYMMACo8AwJ0AwPA5AAaHAAD4PgB+AOD4PgC+AGDwOQDIgwDCAQAg8f8AAPP/AAD/DwADAAcMDgQEMAAQYADggMAlAAgYADgAcADgAMAuAAABzgAuAAHkIgANBgACDAAcMDgQEMAAQICDAAAMAA4AHAA4YHDg4MDAAJwAMAABYgEIBwcGBhAAGCBAhQB7CQMABwgOHBw4OHDwIgB7gwA9DAQABggAHCA4MDCAAMCJAHACADBAgwAb/wcAIAEgAmAD4IcAAIcAAIcAAJ8AAAYEYAVgBiAHhwA/hwA/hwA/nwA/B+AIIAlgCuALhwB/hwB/hwB/nwB/COAM4A0gDiAPYIcAwIcAwIcAwJ8AwPD/AADw/wAA8v8AAAEAIJwAAABg8CEAIJ0AQPAhAGCcAIDwIgCfnQDA8P8F4J8AwP8C/wDDQwCBwwADIwAAPEMAfsMAFAP/AP88Q/9+Av88/48AEMMADwA8Q4F+AMOUAC0M/wD/AP8A/wD/AP8A/5MAL4QAA9oAhosAIzAAjABAlACtkAAiADwnfgE8PJQAPooA85QAXooA85QAfokBE5QAHYoAEpQA/YoAEpQBHcsAHuQhAP8DAGABoIMAAIMAAIMAAIMAAIMAAIMAAIMAAIMAAIMAAIMAAIMAAIMAAIMAAIMAAIMAAPA/AAADAiAD4IMAgIMAgIMAgIMAgIMAgIMAgIMAgIMAgIMAgIMAgIMAgIMAgIMAgIMAgIMAgPA/AIDw/wAA8P8AAPD/AADz/wAA/wUAIAHgAaBBACAFAiADYAAgjwAAnwAAAASEAA0IBCAF4AZgByAIjwA/nwA/AiAE4IQAQgegCOAH4AagBY8Af58Af4MADwBgxAASBSADoALgAI8Av54Av/A5AAaGAADwOQBHhgBBhgCI8DgAf4YAyPA4AL/x/wAA8/8AAP8DAGABYEMCIAMBIAAgjwAAnwAABAGgA2AEhAADBQQgAyAB4I8AQJ8AQA8CIASgBaAGYAYgBeAE4AIgjwCAnwCAQQIgAAZBoAcE4AbgAiCPAL6dAL7wOwAEhQAA8DkARocAQPA5AIiFAILwOwDIgwDE8f8AAPP/AAD/HwAgASAAIAEgACABIAAgASAAIAEgACABIAAgASAAIAEgngAAACD4PgA+ACDwPwAA+D8AvvDAAAAeoACgAaAAoAGgAKABoACgAaAAoAGgAKABoACgAaAAoJ4BwACg+D4B/gCg8D8BwPi+An4AoPL/AED5vgG+ACD/5CAARjwAMTxHADwtPNAAIT88VwA8RzwARwA8MADwLgAhRwA8VzwALwBHPAAvPDAARzwAJgD4NwG3EDw8PDw8PDw8PDw8PDw8PDw8jgAohwEY1wAoADz4JgIXmAG3BjwAPAA8ADyGARiYAb6XAjjYAn/PAp4mPP/gLwDgASAC4AEgA+ABIATgASAF4AEgBuABIAfgASAI4AEgCeABIArgASAL4AEgDOABII8AAPA/AADwPwAA8D8AAPA/AADwPwAA8D8AAPA/AADwPwAA8D8AAPA/AADwPwAA8D8AAPA/AADwPwAA8D8AAPP/AAD/BwAgAeABoAAghwAAhwAAhwAAnwAAAAFB4AICoAGghwBAhwBAhwBAnwBAAAFBYAICIAEghwCAhwCAhwCAnwCABgAgAWABIACEAL8CASAAhAC/AgEgAIQAvwIBIACeAL8BACDw/wAA8P8AAPD/AADz/wAA/wcAIAHgAaAAIIcAAIcAAIcAAJ8AAAcB4AJgAiABoIcAQIcAQIcAQJ8AQAcBYALgAqABIIcAgIcAgIcAgJ8AgAYAIAFgASAAhAC/AgEgAIQAvwIBIACEAL8CASAAngC/AQAg8P8AAPD/AADw/wAA8/8AAP8NAQEDAwcH8P/g/z/Af4BD/wDgIA8AHwA/AH8A/wAA/wH+A/z4//D/Hx8/P39/AAABAAMAB8gAF4MAIgUH+PAA4ACDACwK//8B/wP/B/8P/x9D/wAAAIMAAAX4APAAH+CDAApBAP8AAIYAUwM//3///0gAIAABSyAAACCTABITAiACIAIgAiACIAIgAiACIAIgA6BLAiCTAFJIBCAABUsgBAAgkwCSSAagAAdLoAYAoJMA0hIIoAigCKAIoAigCKAIoAigCKAJS6AIlAERSAAg8T8AEvE/ABLzvwAS8G0AEv8w/wADQf8HBf8P/x//fyP/Aw/wf4BD/wAD/w//f0EA/wUB/gf4D/BBH+ABP8BHAP8C/w//rAAjAT/AQn+BR/8DQv+BAf/AyQBbAgH/A4QAUAcH/x/+P/g/8EF/4AT/wAH+D8wAXUI/wIkAYP8fACABIAAgASAAIAEgACABIAAgASAAIAEgACABIAAgASCeAAAAIPg+AD4AIPA/AAD4PwC+8D8AAPg/AT7wPwAA+D8BvvA/AAD4PwI+8D8AAPg/Ar7wPwAA+D8DPvA/AAD4PwO+8/8AAP8fACAAYAAgAGAAIABgACAAYAAgAGAAIABgACAAYAAgAGCfAAAAAPg+AD/wQAAA+D4Av/BAAAD4PgE/8EAAAPg+Ab/wQAAA+D4CP/BAAAD4PgK/8EAAAPg+Az/wQAAA+D4Dv/P/AAD/JwAo/0EA/wEA/yQA2wAbDwAAAAAAAAAAAAAAAAAAAABL/wCHACBL/wCOACCQAGePAACGAGCGAA/JAKj4PwCHlgCJAf8AjwABBv/////////HAM/DAKbcAUPGAL6HAUjkL/+fAWn/BwCgAeAC4ANghwAAhwAAhwAAnwAABwTgBSAGYAeghwBAhwBAhwBAnwBABgggCeAKIAuHAH+HAH+HAH+fAH8IoAwgDWAOoA/ghwDAhwDAhwDAnwDA8P8AAPD/AADw/wAA8/8AAP8HACABIAKgA2CHAACHAACHAACfAAAGBOAF4AagB4cAP4cAP4cAP58AP8MARwRgBSAEIIcAgIcAgIcAgJ8AgAcDoAJgAeAA4IcAwIcAwIcAwJ8AwPD/AADw/wAA8P8AAPP/AAD/QwAIQwgASwAINwhHAAgvAE8IACcAJQgBCAiXAADHAI83AC8IAACFAAiQAK9HCAAvCDcAxwCvlgDZAADYAN8OCAAIAAgACAAIAAgACAAITwgAMADGAJ74KADfSggAAAhLCAD/P/8K3//v//f/+//9//40/wgD//cPDx/f/z+nACkHB/8P/x8/P3+GAEoHM89nn88/n3+DAEgC/v/9MP+DACCsAEQj/4oAh4MAYAnAMJ9/AP9/gAABhwBuCeD/wP+A/wH//wP/BwDgAaACYACghwAAhwAAhwAAnwAABwIgA2AD4AEghwBAhwBAhwBAnwBABwHgAyADoALghwCAhwCAhwCAnwCAxAAGAmAAIIcAwIcAwIcAwJ8AwPD/AADw/wAA8P8AAPP/AAD/DwAgASACIAFgACADIAQgA2CPAACfAAAAAUIgAgEgA0IgBAAgjwBAnwBAAQGghgBCAKCPAHqfAHpCBCAAAIQAfwIB4ACEAIcBA+CPAMCfAMDw/wAA8P8AAPD/AADz/wAA/wMAYAEggwAAQQIgAwMgBKCDAAyDAAyDAAyDAAyTAAxBBSAAAMYAB8YAPkFgBQBg8CUADgEDIEECYMYABgAg8H8AAPB/AADwfwAA8H8AAPB/AADwfwAA8H8AAPP/AAD/BQAgAaACYEEDIAUEYAVgACCPAACfAAABACDwPQAAAQVg8D0AQAAE8D8AfwLgBeCEAA4CIALgjwD8nwD8QQMg8D0BAgAE8D0BQQLgBeDwPQGCAQAg8f8AAPP/AAD/AwAgAeCDAACDAACDAACDAACDAACDAACDAACfAAADAuADIIMAQIMAQIMAQIMAQIMAQIMAQIMAQJ4AQPA+AAEBACDwPQBCAQLg8P8AAPD/AADw/wAA8/8AAP9DACBDASBDAiBDAyBDBCBDBSBDBiBDByDwPwAA8D8AAPA/AADwPwAA8D8AAPA/AADwPwAA8D8AAPA/AADwPwAA8D8AAPA/AADwPwAA8D8AAPA/AADz/wAA/ysAI/9F/wCDAAcCAP8AKP+PAAwD/wD/ANsAGwcAAAAAAP8A/03/AIkABgcA/wD/AP//AM0AY8QARYMAH5cAKYYAYgD/hgCNzwCGhgDEhQChAf//0AAh/wgAAA8PAAAPDwDIAAgHAA8AAAAPAADFABjkMQCNAAIBAADNAB+IAAD4KAB4Bg8PAAAPDwDFAKj4IgBikgAPAwAPAADZAOeLAIPwIgBf8CAAE/hMAR7/DAEAAwAHAA8AHwA/AH9IAP8NAAH/A/8H/w//H/8//38i/zEAHwEBAwMHBw8PHx8/P39//wD+APwA+ADwAOAAwACAAAD/jQAgAQAAjQBC/wECBkEFDEEKGUEUMgIoZAFBAANBAAdBAA4BABwrAAQBAAEBAowAIcMAEwACQQIEQQUJQQoTARQmiwAUAhwAOIsAIwQDAQMCBi0AAQEA/18AIF8BIOhfACBfAqDoPwAgXwMgXwAgXwSgXwUgXwYgXwcgXwegXwYgXwUgXwQgXwAgXwOg6D8AIF8CIOhfACBfAaDonwAg/yQADgEAAwAHAA8AHwA/AA8Af0UA/zMAnwAFDwEBAwMHBw8PHx8/Pw8Pf38r/wEAP0EAfwEAf0sA/54AcQIAPz8jfwF/fzf//y8ADQEBAwMHBw8PHx8/P39/Iv8OAf8D/wf/D/8f/z//f///R/8AHwD/Af4D/Af4D/Af4D/Af4AAAQADAAcADwAfAD8AfwD//0MPAELwAADw5DAAQw/w1wBHQw//Q/D/LwCPAGBH/wCPAAAP/wD/AP8A/wD/AP8A/wD/ACcPJ/CvAACPAEBH/wCPAMCPAED/MP9GAP8lAAEICIQAIscAJyQIQggAAAgwAE7/AAD/V/8ALwBH/wAv/zAAR/8AJgD4JwD3CQAAAAAAAAAAFSYtAAE4PyUA/zAARv8AMf/PAB4O/wD/AP8A/wD/AP8A/wD/V/8ALwBH/wAv/zAAR/8AJgDXANdXAP8v/0cA/y8AMP9HAP8m/9YBd+Qw//9H/wAwAAL/AP9D/wDTACNF/wAi/wD/MwBH/wAlAPghAHiKACYC/wD/iwAqAv8A/40AeQH//5gAqY4AmAAAygDpAv8AAP9IAP8MAf8D/wf/D/8f/z//fzD/jwAURgD/DwH/Af4D/Af4D/Af4D/Af4BJ/wAA/4wAEgD/ngAwAgD/AJwAT/9DD/BD/wBHAP9DDwAn8M8AD0MP8EPw/0f/AI8AIEL/AAD/yABnqAAwpgBJLwAnD0fw/4gAgIUAIagAdy///0MP8EP/AEcA/0MPACfwzwAPQw/wQ/D/R/8AjwAgQv8AAP/IAGeoADCmAEkvACcPR/D/iACAhQAhqAB3L///R/8ALwBH/wBHAP9P/wBHAP8/AE//AOQg/0cA/y7/PwAv/0cA/0f/AEcA/y//TwD/MABG/wAw/0cA/z///0f/AC8AA8M8gX5DAP8DgX7DPC8AR/8AATwAiAAjxQBTAjz/fij/AX7/kAAvAsMAgSgAAoEAw9AAX/8//y8A5CD/VgD/AABHAP8//1cA/0f/AEcA/zAATv8AAP9H/wAvAEf/AC//MABH/wAmANcBlwD/Lv//L/9HAP8vADD/RwD/Jv/WAFfkMP9HAP8vAC//PwBX/wBHAP9H/wAw/0YA/zEAzQFekABeVwD//0cYH0fgAEfnH0f/AEct40cfACUAIv9C/wCEAGgA/yoAhgBwAf8AI/8C////R/8AR0t8R48A/yMAAv8A/4MAAjX/RgD/NACKAARQ/wAvAMoAJpMAS84AJwD/NwBL/wAmAAAA1wCP/0//AEcA/0f/ADD/RgD/MQDPAF4OAP8A/wD/AP8A/wD/AP8AVwD/L/9HAP8vAC///zD/DgH/A/8H/w//H/8//3///0f/AA8A/wH+A/wH+A/wH+A/wH+ARwD//0j/AA3/Af8D/wf/D/8f/z//fy//jwATDwD/AP8A/wD/AP8A/wD/AP//SAD/DQH+A/wH+A/wH+A/wH+AR/8ADgD/Af8D/wf/D/8f/z//fzD//zD/HgD/Af8D/wf/D/8f/z//fwH+A/wH+A/wH+A/wH+A/wD/H1XMqphVMapjVcaqjFUZqjM8A3gH8Q7jHMc4j3Ae4DzA/wAATnoudi52LnYLcshtpmnIbQtyLnYudi52LnYudk56AAD/P5wDGgPYAlYCFALSAZABTgEMAcoAiACGAEQAIDgAAP9/vwNdAxoD2AKWAjMC8QGuAWwBCQHHAIQAQgAAAAAAEgAQAA4ACgAIAAQAAgAACAAQACAAKAAwAEAASABQAAAAACMARgBpAI0AkQBsAEgAJAAAAAAAAAAAAAAAAAAAAMA1oDnAMWIxiD1kLWQthjloQUtJZC2GNUY5h0GoSQAAAFAHXTFqvXcQWuc8QiAAAAAAAAAAAAAAAAAAAAAAAAAUGBAUDRAKDAYIAwQAAAAMABQAHAAgACgAMAA0AEQAAAwADQANAA0ADgAvAFAAcQCyANMAFAE1AXYBtwH4AQAAACAAIAAgACBgJKAoAC2AMaApACAAIAAgACAAIAAgAABAdQBt4GCgWIBQYEhAPCA0ACwAICAwQECAUOBgHwAAAINGxD7EPsQ+xD7EPsQ+xD7EPsQ+xD7EPsQ+xD7EPgAAAHwAdABsAGAAWABQAEgAYAA0ACwAJAAYABAACAAAAACUUkop3ntQWZhh3FEeQt5C3kPYQ9BD0FvQe9B6EHoAAJRSkxhyIHIocTBxOFFAT0RMQEpAJ0AkPCI8QTxBPAAA4AMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACWGpxTWkMYM9gilhqWGpYalhqWGpYalhqWGpYalhoAAJRSBiAEGAMUAhABCAEEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAcoDgAWcBAAAAAAkhIaUiMTK5Q0FTyWBRdV2F5Zbpl22UbZlxmfWYAAJRSAAAADAAYACAALAA4AEQARAA8ADAAKAAgABQADAAAgDGAMYAxgDGAMcApICJgEsACYBbgJYAtgC2ALeAlAAAAQABAAEAAQABAAFQAaAB8AGgAUAA4ACQAQABAAEAAAHBLsU8vQ80+jDZKLgkqrW7udmxiS1oJUshJp0EAAAAAAAQADCEYQySFMMg8K0WPUStJ6TymNGQsIiABGAAMAAAAKA8uzyWOHS0ZzBBrEEoUjCDNLC85kEHySVFCMDoAAAwAzDgWENgoEgiQCN4YCggOMAQABhjeAxYgFBDeewAABAAGAAgACggMCBAIEggUCBQQFhAWIJoQAAAAAAAAAAAEEEcgiCjGKAk1cDkRQgBEAAAAAAAACwAXAAsAAAAAAJRSxgjoDCkRaxWtHe8lMS5zNrU+90o5V3tjnGu9bwAAAAJISGtMr1TzWFdhuWX7ZRtm2mF4ZTVd8liuUGtMAACAUAAAAAwgHEAoQDhgREA4QCwgJCAYAAwAAAAAAAAAAOxC61LKXipeiWELYfFg92DyYA1hKWHpYWpe617rTgAAc04PAA4ADQANAAwACwAKAAoACQAJAAgACAAHAAYAAAAAIAEkAywGNAk8DUQRSBRIEkwORAtABzgFNAMsASQAAAAgIChALKA04DxARaBNoE0gVkBJ4ECAOEA0ACwBKAAA0CDQKNAw0DDOOM44DDkMOQo5CjkIOQgxCDFIMUgxAACYMZgx2DHaMdoxGioaKloqXCqcKtwq3CoeI14jniMAAJgxmDHYMdox2jEaKhoqWipcKpwq3CrcKhoqGiraMQAAFDMSMxQzFDMWMxYz1jLWMtQy1DLUMhQzEjMSMxIzAABQe1ByUGoOag5iDFoMYk5iTmpQclByUHJOek56TnoAAM5IYEsgRwBL4EbARqBGYEZAQmBCoEbARgBHIEdgSwAA3nvcc9hz1nOWa5RrlGtSa1BrUGsQa9BikGKQYlBiAACUUgAAAgAFAAcAKgQsBC8EMQQvBCwEKgQHAAUAAgAAAJQAERANJAgoAhgADAAYACQAMAA8AEwAWABkAHAAfAAA/2zcSNlAtjiTOG8obCBJGCYQAwQAAAAAAAAAAAAAAAAAAAAACgAVAB8AHAAZABYAEwAPAAwACQAGAAMAAAAAAJRSAABkDOgYbCUJHaYQQwgAAFJKlFLWWhhjWmuccwAA1lpzTjFGEELOOYwxSikIIeccKSVrLa017z0xRnNOAAAAAAAoAEwAdABoAEwANAAYAAAAAAAAAAAAAAAAAAAAAFJSrUUpOcYwYyQhHAAQAAgAECEYQiCEKOcwSj2tRQAAlFLMMsw6jEqMUgxSzEmMScxJDEpMUoxSjErMQsw6AACUUsY4xjjGOAhJCEkIScYYxhjGGIQQhBCEEMYYxhgAAJRSXAJcAlwCHAMcAxwD1wHXAdcBdwJ3AncCAAAAAAAAlFLmMeYx5jFEQURBREEAAAAAAAAAAAAAAAAAAAAAAACUUoAhgCGAIYAhAAIAAgACAAIAAAAAAAAAAAAAAAAAAJRSM2MSWzFTMUcyQzQ/Nj85OzY/ND8yQxBHEU8RWwAAnCJcIlwiXCJcGlwaXBpaGloimiKYKpgq2CrWMtYyAACKJYQI5wxKFa0hECpzNvZCWU/WPnM2ECqtHUoV5wwAAJRSSinee1BZmGHcUR5C3kLeQ9hD0EPQW9B70HoQegAAHAAWKA44BCAACAAYACgAMABAAFAGUAxQFFAWQBYoAADOSLAhsR3RHdIZ8hkTGjIaExryGfIZ0R3RHbAdsCEAAJRSSikrV6tKKz6pMSclpRQhBKQQBx1oKco1S0KrSgAAtyy3LLcgtxgWGVYZthn1HTUe9R22GXYZNxn3GNgcAACaMZs1uzm8Pd1F3kn/UR9W/1H+Td1J3UG8Pbs5mjUAAAACVRx1GJUY1RQVGVUdlSHVJRUqNS51MpU2tTrWQgAAzkjhVuFO4ULhNuMy5S7nKuUq4yriLgAzADsAQwBTAAC9P7pDl0OUQ5FDcENwT1BXUF8wYxBnsGZwYjBiEGIAAGZZw1UDUkNSY0pkPkMyRCokHkQqRDZkQmNOA1LDVQAAlFJQCXEJsg30ETUWdh64IvkqmCJWHhUa8xGyDXEJAADOSOBa4GLBZqJqRmoqai1qKWpkboNqombBYuBi4FoAAFwifCK9Iv0ivCJ8IlsiGyL6Ibkh2iEaIjsiWyKcIgAAlFKaCRkKmA73EvMSzxasGsQY5BgEHSUdRSFlIYYhAADOSABbAFMAQwA7ADMAKwAjABsAIwArADMAOwBDAFMAAJRSqGHoZUhmqGpIZuhhIRqDJgUzaD/lMoMigDkAAAAAcFRRWFNYNFw2YDhgGWAaYBlgGGQ3YDVcU1xSWFBUAAAAeBkVuRS5IJksmTiZRJlQmUiZQJk4mSy5JLkcuRQAAKoZaBlJGUoVrSEQKlIykjLVMlIu7iFrFYwVzBXtFQAABGMaARkBOQE5AVkBWQF5AXkBmQGZAbkBuQHZAdkBAAAeKfhMF10yWU9RTE2LSctFi0lsUU9VM1kXWfhM2jgAAJ8hnyF/JX8lfyl/LX81nzm/QZ85fzF/KX8lnyG/HQAA3jueO547XDscMxwz3DLaMtoyGjMcM1w7nDueO947AABcOVw5XDFcMVwpHCFcIVwhXCFeIZ4hniGeId4h3iEAAFYaYjZCOiI6AT7BOWE1IDHgKKAkYCBAGCAUABAACAAAlFJNNww76jrJOog+Zz5GQkY+Zz6IPqk6yjrrOgw7AACUIpQilBqUGpQalhrWGtgaGCMaIxojXCNcI1wjniMv/wYP/x//P/9/KP8PB/8D/4F/wD/gH/AP+Af8A/8w/w4B/wP/B/8P/x//P/9///9H/wCeABEA//9HAP9I/wAN/wH/A/8H/w//H/8//38v//8CAP8AJP8iAEUA/4gACo8AACMAiwAI/0cq80f8wEcA/y//RyrMR/D//0dVM0cP/0cVM0cPAD8A/zAARv8AAP9H/wAvAP8AAJ4JszSaIAAAHiBSOIowIgTLLJBVUXoiBFI12UlfXgAAiCgMOdBBAAAMEA4QVAgAAAYwCHAAOAAA3EGcQB5BAAAeAp4RGDEAANQSShIKEgAAjkDSKIIpAAAeE1wzGDMAAEhCxEGESQAADnBqbOhsAADeMlhCnjIAANIykELOOgAAngncEJogAADYGJQoVBgAAFYoGBhYPAAA0GgKUYxAAADQaApRjEAAAHUsV0W5NQAATCBMOEgwAABIEI4g1DAAAM4RVBLaEQAABBGGIQYiAAAAEUAhwBkAANBBDDmIKEcA/y8A/+v/ACD/6/8AIP/r/wAg/+v/ACD/6/8AIP/r/wAg/+v/ACD/6/8AIP/r/wAg/+v/ACD/6/8AIP/r/wAg/+v/ACD/6/8AIP8/AP8/AP8/AP8/AP8/AP8/AP8/AP8/AP8/AP8/AP8/AP8vAP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");const U=new Uint8Array(K);new M(U),A.BackgroundLayer=class{static MINIMUM_LAYER=0;static MAXIMUM_LAYER=326;constructor(A){this.graphics=null,this.paletteCycle=null,this.pixels=new Int16Array(s*J*4),this.distorter=new e(this.pixels),this.loadEntry(A);}overlayFrame(A,g,B,w,D){return null!==this.paletteCycle&&(this.paletteCycle.cycle(),this.graphics.draw(this.pixels,this.paletteCycle)),this.distorter.overlayFrame(A,g,B,w,D)}loadGraphics(A){this.graphics=I(P,A);}loadPalette(A){this.paletteCycle=new O({background:A,palette:I(g,A.paletteIndex)});}loadEffect(A){this.distorter.effect=new o(A);}loadEntry(A){this.entry=A;const g=I(B,A);this.loadGraphics(g.graphicsIndex),this.loadPalette(g);const w=g.animation,D=w>>24&255,C=w>>16&255;this.loadEffect(C||D);}},A.Engine=class{static computeAlphas(A){return A.map((g=>g?1/A.filter((A=>A)).length:0))}constructor(A=[],{fps:g=30,aspectRatio:B=0,frameSkip:w=1,alphas:D=this.constructor.computeAlphas(A.map((A=>A.entry))),canvas:C=document.querySelector("canvas")}={}){this.layers=A,this.fps=g,this.aspectRatio=B,this.frameSkip=w,this.alphas=D,this.tick=0,this.canvas=C;}rewind(){this.tick=0;}animate(){let A,g=Date.now();const B=1e3/this.fps;let w;const D=this.canvas,C=D.getContext("2d");C.imageSmoothingEnabled=!1,D.width=256,D.height=224;const I=C.getImageData(0,0,D.width,D.height),Q=()=>{Y=requestAnimationFrame(Q);const D=Date.now();if(A=D-g,A>B){g=D-A%B;for(let A=0;A<this.layers.length;++A)w=this.layers[A].overlayFrame(I.data,this.aspectRatio,this.tick,this.alphas[A],0===A);this.tick+=this.frameSkip,I.data.set(w),C.putImageData(I,0,0);}};Y>0&&commonjsGlobal.cancelAnimationFrame(Y),Q();}},Object.defineProperty(A,"__esModule",{value:!0});}));
    });

    /* ..\..\..\IamRifki\Code\kaleidovium.github.io\src\components\VideoDrugs.svelte generated by Svelte v3.44.0 */

    const file = "..\\..\\..\\IamRifki\\Code\\kaleidovium.github.io\\src\\components\\VideoDrugs.svelte";

    // (46:0) {#if onLoad}
    function create_if_block$1(ctx) {
    	let canvas_1;
    	let canvas_1_intro;

    	const block = {
    		c: function create() {
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "width", "256px");
    			attr_dev(canvas_1, "height", "224px");
    			attr_dev(canvas_1, "class", "svelte-t62jxw");
    			add_location(canvas_1, file, 46, 2, 1136);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas_1, anchor);
    			/*canvas_1_binding*/ ctx[2](canvas_1);
    		},
    		p: noop,
    		i: function intro(local) {
    			if (!canvas_1_intro) {
    				add_render_callback(() => {
    					canvas_1_intro = create_in_transition(canvas_1, fade, { duration: 3500 });
    					canvas_1_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas_1);
    			/*canvas_1_binding*/ ctx[2](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(46:0) {#if onLoad}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*onLoad*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*onLoad*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*onLoad*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function randomIntFromInterval(min, max) {
    	return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('VideoDrugs', slots, []);
    	let canvas;
    	let onLoad = false;

    	onMount(() => {
    		// This will load first by setting onLoad to True
    		setTimeout(() => $$invalidate(1, onLoad = true), 50);

    		// This will load second, initialise EBB's Engine
    		setTimeout(
    			() => {
    				const engine = new earthboundBattleBackgroundsRollup_umd.Engine([
    						new earthboundBattleBackgroundsRollup_umd.BackgroundLayer(randomIntFromInterval(earthboundBattleBackgroundsRollup_umd.BackgroundLayer.MINIMUM_LAYER, earthboundBattleBackgroundsRollup_umd.BackgroundLayer.MAXIMUM_LAYER)),
    						new earthboundBattleBackgroundsRollup_umd.BackgroundLayer(randomIntFromInterval(earthboundBattleBackgroundsRollup_umd.BackgroundLayer.MINIMUM_LAYER, earthboundBattleBackgroundsRollup_umd.BackgroundLayer.MAXIMUM_LAYER))
    					],
    				{ canvas });

    				engine.animate();
    			},
    			100
    		);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<VideoDrugs> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		fade,
    		BGLayer: earthboundBattleBackgroundsRollup_umd.BackgroundLayer,
    		Engine: earthboundBattleBackgroundsRollup_umd.Engine,
    		canvas,
    		onLoad,
    		randomIntFromInterval
    	});

    	$$self.$inject_state = $$props => {
    		if ('canvas' in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ('onLoad' in $$props) $$invalidate(1, onLoad = $$props.onLoad);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvas, onLoad, canvas_1_binding];
    }

    class VideoDrugs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VideoDrugs",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* ..\..\..\IamRifki\Code\kaleidovium.github.io\src\App.svelte generated by Svelte v3.44.0 */

    // (13:0) {#if window.innerWidth >= "850"}
    function create_if_block(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*videoDrugsDisable*/ ctx[1] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*videoDrugsDisable*/ ctx[1]) {
    				if (if_block) {
    					if (dirty & /*videoDrugsDisable*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(13:0) {#if window.innerWidth >= \\\"850\\\"}",
    		ctx
    	});

    	return block;
    }

    // (14:2) {#if videoDrugsDisable}
    function create_if_block_1(ctx) {
    	let videodrugs;
    	let current;
    	videodrugs = new VideoDrugs({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(videodrugs.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(videodrugs, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(videodrugs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(videodrugs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(videodrugs, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(14:2) {#if videoDrugsDisable}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t;
    	let layout;
    	let updating_parsedUrl;
    	let updating_videoDrugsDisable;
    	let current;
    	let if_block = window.innerWidth >= "850" && create_if_block(ctx);

    	function layout_parsedUrl_binding(value) {
    		/*layout_parsedUrl_binding*/ ctx[2](value);
    	}

    	function layout_videoDrugsDisable_binding(value) {
    		/*layout_videoDrugsDisable_binding*/ ctx[3](value);
    	}

    	let layout_props = {};

    	if (/*parsedUrl*/ ctx[0] !== void 0) {
    		layout_props.parsedUrl = /*parsedUrl*/ ctx[0];
    	}

    	if (/*videoDrugsDisable*/ ctx[1] !== void 0) {
    		layout_props.videoDrugsDisable = /*videoDrugsDisable*/ ctx[1];
    	}

    	layout = new Layout({ props: layout_props, $$inline: true });
    	binding_callbacks.push(() => bind(layout, 'parsedUrl', layout_parsedUrl_binding));
    	binding_callbacks.push(() => bind(layout, 'videoDrugsDisable', layout_videoDrugsDisable_binding));

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			create_component(layout.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(layout, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (window.innerWidth >= "850") if_block.p(ctx, dirty);
    			const layout_changes = {};

    			if (!updating_parsedUrl && dirty & /*parsedUrl*/ 1) {
    				updating_parsedUrl = true;
    				layout_changes.parsedUrl = /*parsedUrl*/ ctx[0];
    				add_flush_callback(() => updating_parsedUrl = false);
    			}

    			if (!updating_videoDrugsDisable && dirty & /*videoDrugsDisable*/ 2) {
    				updating_videoDrugsDisable = true;
    				layout_changes.videoDrugsDisable = /*videoDrugsDisable*/ ctx[1];
    				add_flush_callback(() => updating_videoDrugsDisable = false);
    			}

    			layout.$set(layout_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(layout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(layout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(layout, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let parsedUrl = new URL(window.location.href);

    	// Define the variable that we'll use to check if VideoDrugs should be disabled
    	let videoDrugsDisable = parsedUrl.searchParams.get("videodrugsdisable") === "true"
    	? false
    	: true;

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function layout_parsedUrl_binding(value) {
    		parsedUrl = value;
    		$$invalidate(0, parsedUrl);
    	}

    	function layout_videoDrugsDisable_binding(value) {
    		videoDrugsDisable = value;
    		$$invalidate(1, videoDrugsDisable);
    	}

    	$$self.$capture_state = () => ({
    		Layout,
    		VideoDrugs,
    		parsedUrl,
    		videoDrugsDisable
    	});

    	$$self.$inject_state = $$props => {
    		if ('parsedUrl' in $$props) $$invalidate(0, parsedUrl = $$props.parsedUrl);
    		if ('videoDrugsDisable' in $$props) $$invalidate(1, videoDrugsDisable = $$props.videoDrugsDisable);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		parsedUrl,
    		videoDrugsDisable,
    		layout_parsedUrl_binding,
    		layout_videoDrugsDisable_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
